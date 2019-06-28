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
  selector: 'charts4ng-pie',
  template: `
    <svg class="pie-chart" #svg [attr.viewBox]="'0 0 ' + width + ' ' + height" text-anchor="middle">
      <g [attr.transform]="'translate(' + (width / 2) + ', ' + (height / 2) + ')'">
        <g class="pie" #pie>
          <ng-container *ngFor="let a of arcs">
            <path [attr.d]="arc(a)" [attr.fill]="color(selector(a.data))" shape-rendering="geometricPrecision"></path>
            <g class="label">
              <text x="0" y="-.2em" class="first">{{ labelSelector(a.data) }}</text>
              <text x="0" y="1em" class="second">{{ valueText(a.data) }}</text>
            </g>
          </ng-container>
        </g>
        <g class="total">
          <text x="0" y="-.2em" class="first">Total</text>
          <text x="0" y="1em" class="second">{{ total }}</text>
        </g>
        <circle *ngIf="noValue" [attr.r]="5 * radius / 6" [attr.stroke-width]="radius / 3" stroke="#505050" fill="none" />
      </g>
    </svg>
  `,
  styles: [`
    .pie-chart {
      height: 100%;
      width: 100%;
      font: 20px 'Roboto';
      color: currentColor;
    }
    .pie-chart path {
      stroke: #424242;
      stroke-width: 1;
    }
    .pie-chart text {
      fill: currentColor;
    }
    .pie-chart .label {
      display: none;
    }
    .pie-chart path:hover + .label {
      display: unset;
    }
    .pie-chart .pie:hover + .total {
      display: none;
    }
    .pie-chart .first {
      font-weight: 500;
    }
    .pie-chart .second {
      font-weight: 300;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieComponent implements OnInit, OnChanges {

  @Input() data: any[] = [];
  @Input() sort: (a: any, b: any) => number = null;
  @Input() selector: (a: any) => number;
  @Input() labelSelector: (a: any) => string;

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;
  @ViewChild('pie', { static: true })
  private pieRef: ElementRef;

  height = 100;
  width = 100;
  radius = 100;

  pie: d3.Pie<any, any>;
  arc: d3.Arc<any, {}>;
  arcs: any[] = [];
  color;

  total: string;

  get noValue() {
    return this.total === '0';
  }

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.initPie();
    setTimeout(() => this.update());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sort || changes.data && !changes.data.isFirstChange()) {
      this.update();
    }
  }

  initPie() {
    this.pie = d3.pie<any>()
      .padAngle(0)
      .sort(this.sort)
      .value(this.selector);
  }

  @HostListener('window:resize')
  update() {
    this.initPie();

    this.data.sort((a, b) => this.selector(b) - this.selector(a));

    const value = this.data.reduce((a, b) => a + this.selector(b), 0);
    const specifier = value > 100 ? '.3s' : value > 10 ? '.2s' : '.1s';
    this.total = d3.format(specifier)(value);

    this.height = this.svgRef.nativeElement.clientHeight;
    this.width = this.svgRef.nativeElement.clientWidth;

    this.radius = Math.min(this.width, this.height) / 2;
    this.arc = d3.arc<any>()
      .innerRadius(this.radius * 0.67)
      .outerRadius(this.radius - 1)
      .cornerRadius(2);

    this.arcs = this.pie(this.data);

    if (this.data.length > 1) {
      this.color = d3.scaleOrdinal<any>()
        .domain(this.data.map(d => this.selector(d).toString()))
        .range(d3.quantize(t => d3.interpolateRgb('#64dd17', '#fff')(t), this.data.length));
    } else {
      this.color = () => '#64dd17';
    }

    this.cdr.markForCheck();
  }

  valueText(d: any): string {
    const value = this.selector(d);
    const specifier = value > 100 ? '.3s' : value > 10 ? '.2s' : '.1s';
    return d3.format(specifier)(this.selector(d));
  }

}
