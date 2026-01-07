import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { BookmarkProductDto } from './dto/bookmark-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Admin endpoints (would typically be protected)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  // Public endpoints
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // Product search endpoint
  @Get('search')
  search(@Query() searchDto: SearchProductsDto) {
    return this.productsService.searchProducts(searchDto);
  }

  // Cart management endpoints (user must be authenticated)
  @Get('cart')
  @UseGuards(JwtAuthGuard)
  getCart(@Request() req) {
    return this.productsService.getCart(req.user.userId || req.user.sub);
  }

  @Post('cart/add')
  @UseGuards(JwtAuthGuard)
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.productsService.addToCart(req.user.userId || req.user.sub, addToCartDto);
  }

  @Patch('cart/update/:productId')
  @UseGuards(JwtAuthGuard)
  updateCartItem(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.productsService.updateCartItem(
      req.user.userId || req.user.sub,
      +productId,
      updateCartItemDto
    );
  }

  @Delete('cart/remove/:productId')
  @UseGuards(JwtAuthGuard)
  removeFromCart(@Request() req, @Param('productId') productId: string) {
    return this.productsService.removeFromCart(req.user.userId || req.user.sub, +productId);
  }

  @Post('cart/clear')
  @UseGuards(JwtAuthGuard)
  clearCart(@Request() req) {
    return this.productsService.clearCart(req.user.userId || req.user.sub);
  }

  // Checkout endpoint (user must be authenticated)
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Request() req, @Body() checkoutDto: CheckoutDto) {
    return this.productsService.checkout(req.user.userId || req.user.sub, checkoutDto);
  }

  // Bookmark/Wishlist endpoints (user must be authenticated)
  @Post('bookmark')
  @UseGuards(JwtAuthGuard)
  addBookmark(@Request() req, @Body() bookmarkDto: BookmarkProductDto) {
    return this.productsService.addBookmark(req.user.userId || req.user.sub, bookmarkDto.productId);
  }

  @Delete('bookmark/:productId')
  @UseGuards(JwtAuthGuard)
  removeBookmark(@Request() req, @Param('productId') productId: string) {
    return this.productsService.removeBookmark(req.user.userId || req.user.sub, +productId);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  getUserBookmarks(@Request() req) {
    return this.productsService.getUserBookmarks(req.user.userId || req.user.sub);
  }

  @Get(':id/is-bookmarked')
  @UseGuards(JwtAuthGuard)
  isBookmarked(@Request() req, @Param('id') productId: string) {
    return this.productsService.isBookmarked(req.user.userId || req.user.sub, +productId);
  }
}
