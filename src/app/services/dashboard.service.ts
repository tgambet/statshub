import {EventEmitter, Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private focused: EventEmitter<boolean> = new EventEmitter();
  private focusedElement: EventEmitter<string> = new EventEmitter();

  focused$: Observable<boolean> = this.focused.asObservable().pipe(shareReplay(1));
  focusedElement$: Observable<string> = this.focusedElement.asObservable().pipe(shareReplay(1));

  constructor() {
    this.focused$.subscribe();
    this.focusedElement$.subscribe();
    this.focused.emit(false);
    this.focusedElement.emit(undefined);
  }

  focus(element: string): void {
    this.focusedElement.emit(element);
    this.focused.emit(true);
  }

  blur(): void {
    this.focused.emit(false);
  }

  isFocused(element: string): Observable<boolean> {
    return combineLatest([this.focused$, this.focusedElement$]).pipe(
      map(result => result[0] && result[1] === element)
    );
  }

}
