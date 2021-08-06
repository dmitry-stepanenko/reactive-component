import { Component, ChangeDetectionStrategy, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { combineLatest, Subject } from 'rxjs';
import { ProductsFacade } from '../../+state/products.facade';
import { InventoryTypeItem, Product, ProductsFilter } from '../../models/products.models';
import { filter, map, startWith, switchMapTo, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductsFacade],
})
export class ProductsTableComponent implements AfterViewInit, OnDestroy {
  readonly displayedColumns: string[] = ['inventory_id', 'name', 'inventory_number'];

  readonly filterForm: FormGroup = this.getFilterForm();
  readonly pageData$: Observable<PageData> = this.getPageData();

  private readonly onDestroy$ = new Subject<void>();

  constructor(private productsFacade: ProductsFacade, private fb: FormBuilder) {
    this.productsFacade.getProducts();
    this.productsFacade.loadInventoryTypes();
  }

  ngAfterViewInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  pageChanged(event: PageEvent) {
    this.productsFacade.setPager({ offset: event.pageSize * event.pageIndex, count: event.pageSize });
  }

  private getPageData(): Observable<PageData> {
    const productsLoaded$: Observable<boolean> = combineLatest([
      this.productsFacade.productsInitiallyLoaded$,
      this.productsFacade.productsLoaded$,
    ]).pipe(map((loaded) => loaded.every(Boolean)));

    const inventoryTypesMap$ = this.productsFacade.inventoryTypesLoaded$.pipe(
      filter(Boolean),
      switchMapTo(this.productsFacade.inventoryTypes$),
      map((inventoryTypes) => new Map(inventoryTypes.map((e) => [e.type, e.displayed_name])))
    );

    const part1$ = combineLatest([
      productsLoaded$,
      this.productsFacade.products$,
      this.productsFacade.totalCount$,
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)), // убрать startWith и спросить, почему не работает
      this.productsFacade.inventoryTypesLoaded$,
    ]).pipe(
      map(([productsLoaded, products, totalCount, filterValue, inventoryTypesLoaded ]) => {
        const isFilterApplied = Object.values(filterValue).some(Boolean);
        return {
          showLoading: !productsLoaded || !inventoryTypesLoaded,
          formDataLoaded: inventoryTypesLoaded,
          showNoResults: productsLoaded && !products.length && !isFilterApplied,
          products,
          totalCount,
        };
      })
    );

    const part2$ = combineLatest([
      this.productsFacade.inventoryTypes$,
      inventoryTypesMap$,
    ]).pipe(
      map(([inventoryTypes, inventoryTypesMap]) => ({
        inventoryTypes,
        inventoryTypesMap,
      }))
    );

    return combineLatest([part1$, part2$]).pipe(
      map(([part1, part2]) => ({...part1, ...part2}))
    )
  }

  private getFilterForm(): FormGroup {
    return this.fb.group({
      searchText: null,
      inventory_type: null,
    });
  }

  private setupSubscriptions() {
    this.filterForm.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe((formValue: ProductsFilter) => {
      this.productsFacade.setFilters(formValue);
    });
  }
}

interface PageData {
  products: Product[];
  totalCount: number;
  showNoResults: boolean;
  formDataLoaded: boolean;
  showLoading: boolean;
  inventoryTypesMap: Map<InventoryTypeItem['type'], InventoryTypeItem['displayed_name']>;
  inventoryTypes: InventoryTypeItem[]
}

/* 
1. загрузку с пагинацией. отдельное событие подгрузки второй страницы
2. фильтр с данными с бека
3. словарь со свойствами
4. кнопка "лайкнуть" в каждом элементе таблицы, состояние загрузки
*/
