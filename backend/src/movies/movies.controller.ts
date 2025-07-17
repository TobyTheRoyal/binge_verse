import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { Content } from '../content/entities/content.entity';

@Controller('movies')
export class MoviesController {
  constructor(private readonly contentService: ContentService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Content> {
    const content = await this.contentService.findById(+id);
    if (!content || content.type !== 'movie') {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return content;
  }
}