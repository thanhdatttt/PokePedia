import { Injectable, NotFoundException } from "@nestjs/common";
import { PokemonMovesQueryDto } from "../dtos/pokemonMoveQuery.dto";
import { PaginatedResult } from "src/common/interfaces/pagination.interface";
import { and, asc, desc, eq, ilike, SQL, sql } from "drizzle-orm";
import { moves, pokemon, pokemonMoves, types } from "src/database/schema/pokemon";
import { DatabaseService } from "src/database/database.service";

@Injectable()
export class PokemonMoveService {
  constructor(
    private readonly db: DatabaseService,
  ) { }

  async getMoves(
    idOrSlug: string,
    query: PokemonMovesQueryDto,
  ): Promise<PaginatedResult<any>> {
    const pokemonId = await this.resolvePokemonId(idOrSlug);

    const {
      page = 1,
      limit = 20,
      search,
      learnMethod,
      sortBy = 'level',
      order = 'asc',
    } = query;
    let { versionGroupId } = query;
    const offset = (page - 1) * limit;

    // Default to this Pokémon's latest version group
    if (!versionGroupId) {
      const [latest] = await this.db.db
        .select({ max: sql<number>`max(${pokemonMoves.versionGroupId})` })
        .from(pokemonMoves)
        .where(eq(pokemonMoves.pokemonId, pokemonId));
      versionGroupId = latest?.max ?? undefined;
    }

    // search conditions
    const conditions: SQL[] = [eq(pokemonMoves.pokemonId, pokemonId)];
    if (versionGroupId) {
      conditions.push(eq(pokemonMoves.versionGroupId, versionGroupId));
    }
    if (learnMethod) {
      conditions.push(eq(pokemonMoves.learnMethod, learnMethod));
    }
    if (search) {
      conditions.push(ilike(moves.name, `%${search}%`));
    }
    const whereClause = and(...conditions);

    // query
    const sortableColumns = {
      name: moves.name,
      power: moves.power,
      accuracy: moves.accuracy,
      pp: moves.pp,
      level: pokemonMoves.levelLearnedAt,
    } as const;
    const orderFn = order === 'desc' ? desc : asc;
    const baseSelect = () =>
      this.db.db
        .select({
          moveName: moves.name,
          power: moves.power,
          accuracy: moves.accuracy,
          pp: moves.pp,
          priority: moves.priority,
          damageClass: moves.damageClass,
          moveType: types.name,
          learnMethod: pokemonMoves.learnMethod,
          levelLearnedAt: pokemonMoves.levelLearnedAt,
          versionGroupId: pokemonMoves.versionGroupId,
        })
        .from(pokemonMoves)
        .innerJoin(moves, eq(pokemonMoves.moveId, moves.id))
        .innerJoin(types, eq(moves.moveTypeId, types.id))
        .where(whereClause);

    const [items, totalResult] = await Promise.all([
      baseSelect()
        .orderBy(orderFn(sortableColumns[sortBy]))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)` })
        .from(pokemonMoves)
        .innerJoin(moves, eq(pokemonMoves.moveId, moves.id))
        .where(whereClause),
    ]);

    const totalItems = Number(totalResult[0]?.count ?? 0);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // reusable anywhere else look up by identifier but don't need the full detail row
  private async resolvePokemonId(idOrSlug: string): Promise<string> {
    const isNumericId = /^\d+$/.test(idOrSlug);
    const identifierCondition = isNumericId
      ? eq(pokemon.pokeApiId, Number(idOrSlug))
      : eq(pokemon.slug, idOrSlug);

    const [row] = await this.db.db
      .select({ id: pokemon.id })
      .from(pokemon)
      .where(identifierCondition)
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Pokemon "${idOrSlug}" not found`);
    }

    return row.id;
  }
}