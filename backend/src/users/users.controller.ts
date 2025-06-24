import { Body, Controller, Get, Put, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './users.dto';
import { ApiResponseDto } from '../common/common.interface';
import { UsersService } from './users.service';

/**
 * Controller handling user profile management
 * Manages user profile retrieval and updates
 */
@Controller('profile')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    /**
     * Retrieve logged user profile
     * GET /profile
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any): Promise<ApiResponseDto<any>> {
        return this.usersService.getProfile(req.user.uuid);
    }

    /**
     * Update general profile data
     * PUT /profile
     */
    @Put()
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Req() req: any): Promise<ApiResponseDto<any>> {
        return this.usersService.updateProfile(req.user.uuid, updateProfileDto);
    }
} 