import { Component, inject } from '@angular/core';

import { NgIf, NgFor, CurrencyPipe, AsyncPipe } from '@angular/common';
import { Product } from '../product';
import { ProductService } from '../product.service';
import { EMPTY, catchError } from 'rxjs';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, AsyncPipe],
})
export class ProductDetailComponent {
  errorMessage = '';

  private productService = inject(ProductService);

  // Product to display
  product$ = this.productService.product$
    .pipe(
      catchError((err) => {
        this.errorMessage = err;
        return EMPTY;
      }));

  // Set the page title
  pageTitle = "ProductDetail";
  // pageTitle = this.product
  //   ? `Product Detail for: ${this.product.productName}`
  //   : 'Product Detail';



  addToCart(product: Product) { }
}
