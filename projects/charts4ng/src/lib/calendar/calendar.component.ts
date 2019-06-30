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
      <g class="month-legend" [attr.transform]="monthsLegendTranslate()">
        <text *ngFor="let month of months; let i = index" [attr.x]="i * 4.34524 * cellSize">{{ formatMonth(month) }}</text>
      </g>
      <g class="day-legend" [attr.transform]="daysLegendTranslate()">
        <text text-anchor="end" dy="5">Mon</text>
        <text text-anchor="end" [attr.dy]="2 * cellSize + 5">Wed</text>
        <text text-anchor="end" [attr.dy]="4 * cellSize + 5">Fri</text>
      </g>
      <g [attr.transform]="daysTranslate()">
        <rect class="day" *ngFor="let d of data; trackBy: trackBy" [attr.height]="cellSize" [attr.width]="cellSize"
              [attr.y]="getY(d)" [attr.x]="getX(d)" [attr.fill]="d.value === 0 ? '#606060' : color(d.value)">
          <title>{{ formatDate(d.date) }}: {{ format(d.value) }}</title>
        </rect>
      </g>
    </svg>
  `,
  styles: [`
    .calendar {
      height: 100%;
      width: 100%;
      font: 10px 'Roboto';
    }
    .calendar .day {
      stroke: #424242;
      stroke-width: 2;
      transition: color 300ms ease;
    }
    .calendar text {
      fill: currentColor;
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
  months;
  color;

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

    this.cellSize = Math.floor((this.width - 35) / 53);

    const dates = this.data.map(d => d.date)
      .sort((a, b) => b.toISOString().localeCompare(a.toISOString()));

    this.minDate = d3.min(dates);

    const firstMonth = new Date(dates[dates.length - 1]);
    firstMonth.setUTCMonth(firstMonth.getUTCMonth() + 1);

    const lastMonth = new Date(dates[0]);
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() + 1);

    this.months = d3.utcMonths(d3.utcMonth(firstMonth), d3.utcMonth(lastMonth));

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
    return `translate(${30}, ${(this.height - 7 * this.cellSize) / 2})`;
  }

  daysLegendTranslate() {
    return `translate(${20}, ${(this.height - 7 * this.cellSize) / 2 + 1.5 * this.cellSize})`;
  }

  monthsLegendTranslate() {
    return `translate(${25 + 3 * this.cellSize}, ${(this.height - 7 * this.cellSize) / 2 - 10})`;
  }

}
