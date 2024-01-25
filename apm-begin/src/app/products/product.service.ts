import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Product, Result } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { ReviewService } from '../reviews/review.service';
import { Review } from '../reviews/review';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  catchError,
  combineLatest,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  selectedProductId = signal<number | undefined>(undefined);

  private productsResult$ = this.http.get<Product[]>(this.productsUrl).pipe(
    map((p) => ({ data: p } as Result<Product[]>)),
    tap((p) => console.log(JSON.stringify(p))),
    shareReplay(1),
    catchError((err) =>
      of({ data: [], error: this.errorService.formatError(err) } as Result<
        Product[]
      >)
    )
  );
  private productsResult = toSignal(this.productsResult$, {
    initialValue: { data: [] } as Result<Product[]>,
  });
  products = computed(() => this.productsResult().data);
  productsError = computed(() => this.productsResult().error);

  private productResult1$ = toObservable(this.selectedProductId).pipe(
    filter(Boolean),
    switchMap((id) => {
      const productUrl = this.productsUrl + '/' + id;
      return this.http.get<Product>(productUrl).pipe(
        switchMap((product) => this.getProductReviews(product)),
        catchError((err) =>
          of({
            data: undefined,
            error: this.errorService.formatError(err),
          } as Result<Product>)
        )
      );
    }),
    map((p) => ({ data: p } as Result<Product>))
  );

  // Find product in products
  private foundProduct = computed(() => {
    const p = this.products();
    const id = this.selectedProductId();
    if (p && id) {
      return p.find((product) => product.id === id);
    } else {
      return undefined;
    }
  });
  // Use foundProduct as source for a productResult Observable that gets the rewiews and handle errors
  private productResult$ = toObservable(this.foundProduct).pipe(
    filter(Boolean),
    switchMap((product) => this.getProductReviews(product)),
    map((p) => ({ data: p } as Result<Product>)),
    catchError((err) =>
      of({
        data: undefined,
        error: this.errorService.formatError(err),
      } as Result<Product>)
    )
  );
  // Turn the observable to a signal (productResult) with the Result interface
  private productResult = toSignal(this.productResult$);
  // expose signals to the components with a procduct or error
  product = computed(() => this.productResult()?.data);
  productError = computed(() => this.productResult()?.error);

  productSelected(selectedProductId: number): void {
    this.selectedProductId.set(selectedProductId);
  }

  private getProductReviews(product: Product): Observable<Product> {
    if (product.hasReviews) {
      return this.http
        .get<Review[]>(this.reviewService.getReviewUrl(product.id))
        .pipe(map((reviews) => ({ ...product, reviews } as Product)));
    } else {
      return of(product);
    }
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const formattedMsg = this.errorService.formatError(err);

    return throwError(() => formattedMsg);
    //throw formattedMsg;
  }
}
