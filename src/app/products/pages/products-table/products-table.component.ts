import { Component, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { combineLatest, Observable } from 'rxjs';
import { ProductsFacade } from '../../+state/products.facade';
import { InventoryTypeItem, ProductsFilter } from '../../models/products.models';
import { map, startWith } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductsFacade],
})
export class ProductsTableComponent implements AfterViewInit {
  readonly displayedColumns: string[] = ['inventory_id', 'name', 'inventory_number'];

  readonly filterForm = this.fb.group({
    searchText: null,
    inventory_type: null,
  });

  products$ = this.productsFacade.products$;
  productsInitiallyLoaded$ = this.productsFacade.productsInitiallyLoaded$;
  showLoading$ = combineLatest([
    this.productsFacade.inventoryTypesLoaded$, 
    this.productsFacade.productsLoaded$
  ]).pipe(
    map(loaded => !loaded.every(Boolean))
  );
  totalCount$ = this.productsFacade.totalCount$;
  showNoResults$: Observable<boolean>
  showNoSearchResults$: Observable<boolean>;
  showTable$: Observable<boolean>
  inventoryTypesLoaded$ = this.productsFacade.inventoryTypesLoaded$;
  inventoryTypes: InventoryTypeItem[] = [];

  

  get isFilterApplied() {
    return !this.filterForm.value.searchText && !this.filterForm.value.inventory_type;
  }

  constructor(private productsFacade: ProductsFacade, private fb: FormBuilder) {
    const data$ = combineLatest([
      this.productsInitiallyLoaded$, 
      this.totalCount$,
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value))
    ]);
    this.showNoResults$ = data$.pipe(map(([loaded, count, filterValue]) => loaded && !count && !Object.values(filterValue).some(Boolean)));
    this.showNoSearchResults$ = data$.pipe(map(([loaded, count, filterValue]) => loaded && !count && Object.values(filterValue).some(Boolean)));
    this.showTable$ = combineLatest([this.showNoResults$, this.showNoSearchResults$]).pipe(map(([noResults, noSearchResults]) => !noResults && !noSearchResults));
    this.productsFacade.getProducts();
    this.productsFacade.loadInventoryTypes();
  }

  ngAfterViewInit(): void {
    this.filterForm.valueChanges.subscribe((formValue: ProductsFilter) => {
      this.productsFacade.setFilters(formValue);
    });
    this.productsFacade.inventoryTypes$
      .subscribe(inventoryTypes => this.inventoryTypes = inventoryTypes) 
  }

  pageChanged(event: PageEvent) {
    this.productsFacade.setPager({ offset: event.pageSize * event.pageIndex, count: event.pageSize });
  }

  getInventoryType(type: string) {
    return this.inventoryTypes.find(e => e.type === type)?.displayed_name;
  }

}

/* 
1. загрузку с пагинацией. отдельное событие подгрузки второй страницы
2. фильтр с данными с бека
3. словарь со свойствами
4. кнопка "лайкнуть" в каждом элементе таблицы, состояние загрузки
*/
