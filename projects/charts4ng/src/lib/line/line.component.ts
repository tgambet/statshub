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

@Component({
  selector: 'charts4ng-line',
  template: `
    <svg class="line-chart" #svg [attr.width]="width + margin.left + margin.right" [attr.height]="height + margin.top + margin.bottom">
      <g class="graph" [attr.transform]="'translate(' + margin.left + ', ' + margin.top + ')'">
        <g class="x axis" [attr.transform]="'translate(0, ' + height + ')'" #xAxis/>
        <g class="y axis" #yAxis/>
        <path class="line" d="" #line></path>
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
  `],
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LineComponent implements OnInit, OnChanges {

  @Input() data: { date: Date, value: number }[] = [];

  margin = { top: 10, right: 30, bottom: 20, left: 10 };
  height = 20;
  width = 100;

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;
  @ViewChild('xAxis', { static: true })
  private xAxisRef: ElementRef;
  @ViewChild('yAxis', { static: true })
  private yAxisRef: ElementRef;
  @ViewChild('line', { static: true })
  private lineRef: ElementRef;

  private svgSelection;
  private lineSelection;
  private xAxisSelection;
  private yAxisSelection;
  private xAxisCall: Axis<Date>;
  private yAxisCall: Axis<number>;
  private xScale: ScaleTime<number, number>;
  private yScale: ScaleLinear<number, number>;
  private line: d3.Line<{ date: Date, value: number }>;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.svgSelection = d3.select(this.svgRef.nativeElement);
    this.xAxisSelection = d3.select(this.xAxisRef.nativeElement);
    this.yAxisSelection = d3.select(this.yAxisRef.nativeElement);
    this.lineSelection = d3.select(this.lineRef.nativeElement);

    this.xScale = d3.scaleTime();
    this.yScale = d3.scaleLinear();

    this.xAxisCall = d3.axisBottom<Date>(this.xScale).ticks(5);
    this.yAxisCall = d3.axisRight<number>(this.yScale).ticks(10, 's');

    this.line = d3.line<{ date: Date, value: number }>()
      .defined(d => !isNaN(d.value))
      .x(d => this.xScale(d.date))
      .y(d => this.yScale(d.value))
      .curve(d3.curveMonotoneX);

    setTimeout(() => {
      this.setScale();
      this.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.data.firstChange) {
      this.update(250);
    }
  }

  setScale() {
    this.height = this.svgRef.nativeElement.clientHeight - this.margin.top - this.margin.bottom;
    this.width = this.svgRef.nativeElement.clientWidth - this.margin.left - this.margin.right;

    this.cdr.markForCheck();

    this.xScale
      .domain(d3.extent(this.data, d => d.date))
      .range([0, this.width])
      .nice();

    this.yScale.domain([0, d3.max(this.data, d => d.value)])
      .range([this.height, 0])
      .nice();

    this.xAxisCall.scale(this.xScale);
    this.yAxisCall.scale(this.yScale);

    this.yAxisCall.tickSize(this.width);
  }

  init() {
    this.xAxisCall(this.xAxisSelection);
    this.yAxisCall(this.yAxisSelection);
    this.lineSelection.datum(this.data).attr('d', this.line);
  }

  update(transition: number) {

    this.setScale();
    const t = d3.transition().duration(transition);
    this.xAxisCall(this.xAxisSelection.transition(t));
    this.yAxisCall(this.yAxisSelection.transition(t));
    this.lineSelection.interrupt('trans');
    this.lineSelection
      .datum(this.data)
      .transition('trans')
      .duration(transition)
      .attr('d', this.line);
  }

  @HostListener('window:resize')
  onResize() {
    this.update(0);
  }

}
