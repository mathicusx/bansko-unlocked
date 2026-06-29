import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(private toursService: ToursService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600')
  findAll(@Query('type') type?: string) {
    return this.toursService.findAll(type);
  }

  // Admin listing — includes drafts. Declared before the :id route so it isn't
  // swallowed by the param matcher.
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllForAdmin() {
    return this.toursService.findAllForAdmin();
  }

  // Admin single lookup — includes drafts (needed right after create()).
  @Get('admin/:idOrSlug')
  @UseGuards(JwtAuthGuard)
  findOneForAdmin(@Param('idOrSlug') idOrSlug: string) {
    return this.toursService.findOneForAdmin(idOrSlug);
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTourDto) {
    return this.toursService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTourDto) {
    return this.toursService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
