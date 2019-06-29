import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'charts4ng-calendar',
  template: `
    <svg class="calendar" #svg [attr.width]="width" [attr.height]="height">
      <g class="days" [attr.transform]="daysTranslate()">
        <rect class="day" *ngFor="let d of data; trackBy: trackBy" [attr.height]="cellSize" [attr.width]="cellSize"
              [attr.y]="getY(d)" [attr.x]="getX(d)" [attr.fill]="d.value === 0 ? '#606060' : color(d.value)">
          <title>{{ d.date }} {{ format(d.value) }}</title>
        </rect>
      </g>
    </svg>
  `,
  styles: [`
    .calendar {
      height: 100%;
      width: 100%;
      font: 10px 'Roboto';
      color: currentColor;
    }
    .calendar .day {
      stroke: #424242;
      stroke-width: 2;
      transition: color 300ms ease;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit, OnChanges {

  @Input() data: { date: Date, value: number }[] = [];

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;

  height = 100;
  width = 100;

  formatDate = d3.utcFormat('%x');
  formatMonth = d3.utcFormat('%b');
  format = d3.format('.0s');

  cellSize = 16;
  minDate: Date;
  color;

  formatDay = d => 'SMTWTFS'[d.getUTCDay()];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.init();
    this.update();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      this.update();
    }
  }

  init() {

  }

  @HostListener('window:resize')
  update() {
    this.height = this.svgRef.nativeElement.clientHeight;
    this.width = this.svgRef.nativeElement.clientWidth;

    this.cellSize = Math.floor(this.width / 53);

    this.minDate = d3.min(this.data.map(d => d.date));

    const sortedValues = this.data.map(d => d.value).sort((a, b) => b - a);

    this.color = d3.scaleOrdinal<number, any>()
      .domain(sortedValues)
      .range(
        d3.quantize(
          t => d3.interpolateRgb('#193c0e', '#64dd22')(t),
          [...new Set(sortedValues)].length
        )
      );

    this.cdr.markForCheck();
  }

  trackBy(index: number) {
    return index;
  }

  getY(d: { date: Date, value: number }) {
    return (d.date.getUTCDay() + 1) % 7 * this.cellSize;
  }

  getX(d: { date: Date, value: number }) {
    return d3.utcSaturday.count(this.minDate, d.date) * this.cellSize;
  }

  daysTranslate() {
    return `translate(${0.5}, ${(this.height - 7 * this.cellSize) / 2})`;
  }

}
