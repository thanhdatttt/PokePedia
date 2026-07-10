import { Controller, Get, Param } from '@nestjs/common';
import { TypeService } from './type.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('types')
export class TypeController {
  constructor(private readonly typeService: TypeService) { }

  @Public()
  @Get()
  @ResponseMessage('Types retrieved successfully')
  findAll() {
    return this.typeService.getAllTypes();
  }

  @Public()
  @Get('chart')
  @ResponseMessage('Type effectiveness chart retrieved successfully')
  getChart() {
    return this.typeService.getChart();
  }

  @Public()
  @Get(':name')
  @ResponseMessage('Type detail retrieved successfully')
  getByName(@Param('name') name: string) {
    return this.typeService.getByName(name);
  }
}
