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
import {Axis, ScaleLinear, ScaleTime} from 'd3';
import {simplify} from '../utils/simplify';

@Component({
  selector: 'charts4ng-line',
  template: `
    <svg class="line-chart" #svg [attr.width]="width + margin.left + margin.right" [attr.height]="height + margin.top + margin.bottom">
      <g class="graph" [attr.transform]="'translate(' + margin.left + ', ' + margin.top + ')'">
        <g class="x axis" [attr.transform]="'translate(0, ' + height + ')'" #xAxis/>
        <g class="y axis" #yAxis/>
        <path class="line" *ngFor="let d of data; trackBy: trackBy" [attr.d]="lineD(d)"></path>
      </g>
    </svg>
  `,
  styles: [`
    .line-chart {
      height: 100%;
      width: 100%;
    }
    .line-chart .line {
      fill: none;
      stroke: #ffab00;
      stroke-width: 2;
    }
    .line-chart .y .tick line {
      stroke: #777;
      stroke-dasharray: 2px;
      shape-rendering: crispEdges;
    }
    .line-chart .y .domain, .line-chart .y .tick:first-of-type {
      display: none;
    }
    .line-chart .line {
      transition: d 300ms;
    }
  `],
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LineComponent implements OnInit, OnChanges {

  @Input() data: { date: Date, value: number }[][] = [];

  margin = { top: 10, right: 30, bottom: 20, left: 10 };
  height = 20;
  width = 100;

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;
  @ViewChild('xAxis', { static: true })
  private xAxisRef: ElementRef;
  @ViewChild('yAxis', { static: true })
  private yAxisRef: ElementRef;

  private svgSelection;
  private xAxisSelection;
  private yAxisSelection;
  private xAxisCall: Axis<Date>;
  private yAxisCall: Axis<number>;
  private xScale: ScaleTime<number, number>;
  private yScale: ScaleLinear<number, number>;
  private line: d3.Line<{ x: number, y: number }>;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.svgSelection = d3.select(this.svgRef.nativeElement);
    this.xAxisSelection = d3.select(this.xAxisRef.nativeElement);
    this.yAxisSelection = d3.select(this.yAxisRef.nativeElement);

    this.xScale = d3.scaleTime();
    this.yScale = d3.scaleLinear();

    this.xAxisCall = d3.axisBottom<Date>(this.xScale).ticks(5);
    this.yAxisCall = d3.axisRight<number>(this.yScale).ticks(10, 's');

    this.line = d3.line<{x: number, y: number}>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveMonotoneX);

    setTimeout(() => {
      this.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.data.firstChange) {
      this.update(250);
    }
  }

  init() {
    this.setScale();
    this.xAxisCall(this.xAxisSelection);
    this.yAxisCall(this.yAxisSelection);
  }

  update(transition: number) {
    this.setScale();
    const t = d3.transition().duration(transition);
    this.xAxisCall(this.xAxisSelection.transition(t));
    this.yAxisCall(this.yAxisSelection.transition(t));
  }

  setScale() {
    this.height = this.svgRef.nativeElement.clientHeight - this.margin.top - this.margin.bottom;
    this.width = this.svgRef.nativeElement.clientWidth - this.margin.left - this.margin.right;

    this.cdr.markForCheck();

    const dates = this.data.map(
      d => d.map(v => v.date)
    ).reduce((p, c) => [...p, ...c], []);

    const values = this.data.map(
      d => d.map(v => v.value)
    ).reduce((p, c) => [...p, ...c], []);

    this.xScale
      .domain(d3.extent(dates))
      .range([0, this.width])
      .nice();

    this.yScale.domain([0, d3.max(values)])
      .range([this.height, 0])
      .nice();

    this.xAxisCall.scale(this.xScale);
    this.yAxisCall.scale(this.yScale);

    this.yAxisCall.tickSize(this.width);
  }

  lineD(d: { date: Date, value: number }[]) {
    const datum = d.map(({ date, value }) => ({
      x: this.xScale(date),
      y: this.yScale(value)
    }));
    return this.line(simplify(datum, .5, false));
  }

  @HostListener('window:resize')
  onResize() {
    this.update(0);
  }

  trackBy(i: number) {
    return i;
  }

}
