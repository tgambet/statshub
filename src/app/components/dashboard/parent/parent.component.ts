import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DashboardType} from '@app/components/dashboard/dashboard-type.enum';

@Component({
  selector: 'app-parent',
  template: `
    <app-information *ngIf="type === DashboardType.INFORMATION"></app-information>
    <app-issues *ngIf="type === DashboardType.ISSUES"></app-issues>
    <app-labels *ngIf="type === DashboardType.LABELS"></app-labels>
    <app-popularity *ngIf="type === DashboardType.POPULARITY"
                    [zoomed]="zoomed"
                    (zoomIn)="zoomIn.emit()"
                    (zoomOut)="zoomOut.emit()">
    </app-popularity>
    <app-downloads *ngIf="type === DashboardType.DOWNLOADS"></app-downloads>
    <app-calendar *ngIf="type === DashboardType.CALENDAR"></app-calendar>
    <app-files *ngIf="type === DashboardType.FILES"></app-files>
  `,
  styles: [`
    :host {
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentComponent {

  DashboardType: typeof DashboardType = DashboardType;

  @Input() type: DashboardType;

  @Input() zoomed: boolean;
  @Output() zoomIn: EventEmitter<void> = new EventEmitter();
  @Output() zoomOut: EventEmitter<void> = new EventEmitter();

}
