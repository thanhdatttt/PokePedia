import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';
import { PokemonQueryDto } from '../dtos/pokemonQuery.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { abilities, evolutionChainNodes, generations, items, pokemon, pokemonAbilities, pokemonSpecies, pokemonStats, pokemonTypes, stats, types } from 'src/database/schema/pokemon';
import { alias } from 'drizzle-orm/pg-core';
import { EVOLUTION_CACHE_TTL } from 'src/common/constants/pokeapi.constant';

@Injectable()
export class PokemonService {
  constructor(private readonly db: DatabaseService, private readonly redisService: RedisService,) { }

  async getAll(query: PokemonQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      generation,
      isLegendary,
      sortBy = 'id',
      order = 'asc',
    } = query;
    const offset = (page - 1) * limit;

    // search conditions (where)
    const conditions: SQL[] = [eq(pokemon.isDefault, true)];
    if (search) {
      conditions.push(
        or(
          ilike(pokemonSpecies.name, `%${search}%`),
          ilike(pokemon.slug, `%${search}%`),
        )!,
      );
    }
    if (generation) {
      conditions.push(eq(generations.name, generation));
    }
    if (typeof isLegendary === 'boolean') {
      conditions.push(eq(pokemonSpecies.isLegendary, isLegendary));
    }
    if (type) {
      conditions.push(
        inArray(
          pokemon.id,
          this.db.db
            .select({ id: pokemonTypes.pokemonId })
            .from(pokemonTypes)
            .innerJoin(types, eq(pokemonTypes.typeId, types.id))
            .where(eq(types.name, type)),
        ),
      );
    }
    const whereClause = and(...conditions);

    // query
    const sortableColumns = {
      id: pokemon.pokeApiId,
      name: pokemonSpecies.name,
      height: pokemon.height,
      weight: pokemon.weight,
    } as const;
    const orderFn = order === 'asc' ? asc : desc;
    const baseSelect = () =>
      this.db.db
        .select({
          id: pokemon.id,
          pokeApiId: pokemon.pokeApiId,
          name: pokemonSpecies.name,
          slug: pokemon.slug,
          spriteUrl: pokemon.spriteUrl,
          officialArtUrl: pokemon.officialArtUrl,
          isLegendary: pokemonSpecies.isLegendary,
          isMythical: pokemonSpecies.isMythical,
          generation: generations.name,
        })
        .from(pokemon)
        .innerJoin(pokemonSpecies, eq(pokemon.speciesId, pokemonSpecies.id))
        .innerJoin(generations, eq(pokemonSpecies.generationId, generations.id))
        .where(whereClause);

    const [items, totalResult] = await Promise.all([
      baseSelect()
        .orderBy(orderFn(sortableColumns[sortBy]))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)` })
        .from(pokemon)
        .innerJoin(pokemonSpecies, eq(pokemon.speciesId, pokemonSpecies.id))
        .innerJoin(generations, eq(pokemonSpecies.generationId, generations.id))
        .where(whereClause),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);

    // Second query to attach types for each found item
    const pokemonIds = items.map((p) => p.id);
    const typeRows = pokemonIds.length
      ? await this.db.db
        .select({
          pokemonId: pokemonTypes.pokemonId,
          slot: pokemonTypes.slot,
          typeName: types.name,
          typeColor: types.color,
        })
        .from(pokemonTypes)
        .innerJoin(types, eq(pokemonTypes.typeId, types.id))
        .where(inArray(pokemonTypes.pokemonId, pokemonIds))
        .orderBy(asc(pokemonTypes.slot))
      : [];
    const typesByPokemon = new Map<string, { name: string; color: string }[]>();
    for (const row of typeRows) {
      const arr = typesByPokemon.get(row.pokemonId) ?? [];
      arr.push({ name: row.typeName, color: row.typeColor });
      typesByPokemon.set(row.pokemonId, arr);
    }

    const data = items.map((p) => ({
      ...p,
      types: typesByPokemon.get(p.id) ?? [],
    }));

    return {
      items: data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getDetail(idOrSlug: string) {
    // validate
    const isNumericId = /^\d+$/.test(idOrSlug);

    const identifierCondition = isNumericId
      ? eq(pokemon.pokeApiId, Number(idOrSlug)) : eq(pokemon.slug, idOrSlug);

    // basic info
    const [row] = await this.db.db
      .select({
        id: pokemon.id,
        pokeApiId: pokemon.pokeApiId,
        name: pokemonSpecies.name,
        slug: pokemon.slug,
        formName: pokemon.formName,
        height: pokemon.height,
        weight: pokemon.weight,
        baseExperience: pokemon.baseExperience,
        isDefault: pokemon.isDefault,
        isMega: pokemon.isMega,
        isGmax: pokemon.isGmax,
        spriteUrl: pokemon.spriteUrl,
        shinySpriteUrl: pokemon.shinySpriteUrl,
        officialArtUrl: pokemon.officialArtUrl,
        isLegendary: pokemonSpecies.isLegendary,
        isMythical: pokemonSpecies.isMythical,
        isBaby: pokemonSpecies.isBaby,
        captureRate: pokemonSpecies.captureRate,
        genderRate: pokemonSpecies.genderRate,
        hatchCounter: pokemonSpecies.hatchCounter,
        baseHappiness: pokemonSpecies.baseHappiness,
        flavorText: pokemonSpecies.flavorText,
        generation: generations.name,
        region: generations.regionName,
        speciesId: pokemonSpecies.id,
      })
      .from(pokemon)
      .innerJoin(pokemonSpecies, eq(pokemon.speciesId, pokemonSpecies.id))
      .innerJoin(generations, eq(pokemonSpecies.generationId, generations.id))
      .where(identifierCondition)
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Pokemon "${idOrSlug}" not found`);
    }

    // stats
    const [typeRows, statRows, abilityRows, siblingForms] = await Promise.all([
      this.db.db
        .select({ name: types.name, color: types.color, slot: pokemonTypes.slot })
        .from(pokemonTypes)
        .innerJoin(types, eq(pokemonTypes.typeId, types.id))
        .where(eq(pokemonTypes.pokemonId, row.id))
        .orderBy(asc(pokemonTypes.slot)),

      this.db.db
        .select({
          name: stats.name,
          shortName: stats.shortName,
          baseValue: pokemonStats.baseValue,
          effort: pokemonStats.effort,
        })
        .from(pokemonStats)
        .innerJoin(stats, eq(pokemonStats.statId, stats.id))
        .where(eq(pokemonStats.pokemonId, row.id)),

      this.db.db
        .select({
          name: abilities.name,
          effect: abilities.effect,
          isHidden: pokemonAbilities.isHidden,
          slot: pokemonAbilities.slot,
        })
        .from(pokemonAbilities)
        .innerJoin(abilities, eq(pokemonAbilities.abilityId, abilities.id))
        .where(eq(pokemonAbilities.pokemonId, row.id))
        .orderBy(asc(pokemonAbilities.slot)),

      this.db.db
        .select({
          id: pokemon.id,
          slug: pokemon.slug,
          formName: pokemon.formName,
          spriteUrl: pokemon.spriteUrl,
          isDefault: pokemon.isDefault,
        })
        .from(pokemon)
        .where(eq(pokemon.speciesId, row.speciesId)),
    ]);

    const evolutionChain = await this.getEvolutionChain(row.speciesId);

    const { speciesId, ...pokemonData } = row;

    return {
      ...pokemonData,
      types: typeRows,
      stats: statRows,
      abilities: abilityRows,
      evolutionChain,
      forms: siblingForms.filter((f) => f.id !== row.id),
    };
  }

  private async getEvolutionChain(speciesId: string) {
    // check cache if not create new one
    const cacheKey = `evolution-chain:species:${speciesId}`;
    const cached = await this.redisService.get<ReturnType<typeof this.buildEvolutionTree>>(cacheKey);
    if (cached !== null) {
      return cached; // no need to query
    }

    // Which chain does this species belong to?
    const [currentNode] = await this.db.db
      .select({ chainId: evolutionChainNodes.chainId })
      .from(evolutionChainNodes)
      .where(eq(evolutionChainNodes.speciesId, speciesId))
      .limit(1);
    if (!currentNode) return null;

    // Pull every node in that family, with species name/slug + condition data
    const heldItems = alias(items, 'held_items');
    const nodes = await this.db.db
      .select({
        nodeId: evolutionChainNodes.id,
        parentNodeId: evolutionChainNodes.parentNodeId,
        speciesId: evolutionChainNodes.speciesId,
        speciesName: pokemonSpecies.name,
        speciesSlug: pokemonSpecies.slug,
        trigger: evolutionChainNodes.trigger,
        minLevel: evolutionChainNodes.minLevel,
        minHappiness: evolutionChainNodes.minHappiness,
        timeOfDay: evolutionChainNodes.timeOfDay,
        itemName: items.name,
        heldItemName: heldItems.name,
      })
      .from(evolutionChainNodes)
      .innerJoin(pokemonSpecies, eq(evolutionChainNodes.speciesId, pokemonSpecies.id))
      .leftJoin(items, eq(evolutionChainNodes.itemId, items.id))
      .leftJoin(heldItems, eq(evolutionChainNodes.heldItemId, heldItems.id))
      .where(eq(evolutionChainNodes.chainId, currentNode.chainId));

    // Default art per species
    const speciesIds = nodes.map((n) => n.speciesId);
    const arts = await this.db.db
      .select({ speciesId: pokemon.speciesId, officalArtUrl: pokemon.officialArtUrl })
      .from(pokemon)
      .where(and(inArray(pokemon.speciesId, speciesIds), eq(pokemon.isDefault, true)));
    const artBySpecies = new Map(arts.map((s) => [s.speciesId, s.officalArtUrl]));
    const tree = this.buildEvolutionTree(nodes, artBySpecies);

    await this.redisService.set(cacheKey, tree, EVOLUTION_CACHE_TTL);

    return tree;
  }

  // Reconstructs a tree from a flat adjacency list (parentNodeId → nodeId)
  private buildEvolutionTree(
    nodes: {
      nodeId: string;
      parentNodeId: string | null;
      speciesId: string;
      speciesName: string;
      speciesSlug: string;
      trigger: string | null;
      minLevel: number | null;
      minHappiness: number | null;
      timeOfDay: string | null;
      itemName: string | null;
      heldItemName: string | null;
    }[],
    artBySpecies: Map<string, string | null>,
  ) {
    type TreeNode = (typeof nodes)[number] & { children: TreeNode[] };
    const byId = new Map<string, TreeNode>(
      nodes.map((n) => [n.nodeId, { ...n, children: [] }]),
    );

    let root: TreeNode | null = null;
    for (const node of byId.values()) {
      if (node.parentNodeId && byId.has(node.parentNodeId)) {
        byId.get(node.parentNodeId)!.children.push(node);
      } else {
        root = node; // parentNodeId === null → base stage of the family
      }
    }

    const toResponse = (node: TreeNode): any => ({
      speciesName: node.speciesName,
      speciesSlug: node.speciesSlug,
      officalArtUrl: artBySpecies.get(node.speciesId) ?? null,
      // null on the root
      evolutionDetail: node.parentNodeId
        ? {
          trigger: node.trigger,
          minLevel: node.minLevel,
          minHappiness: node.minHappiness,
          timeOfDay: node.timeOfDay,
          item: node.itemName,
          heldItem: node.heldItemName,
        }
        : null,
      evolvesTo: node.children.map(toResponse),
    });

    return root ? toResponse(root) : null;
  }
}
