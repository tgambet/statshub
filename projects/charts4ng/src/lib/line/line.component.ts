import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'charts4ng-line',
  template: `
    <svg class="line-chart" #svg [attr.width]="width + margin.left + margin.right" [attr.height]="height + margin.top + margin.bottom">
      <g class="graph" [attr.transform]="'translate(' + margin.left + ', ' + margin.top + ')'">
        <g class="x-axis" [attr.transform]="'translate(0, ' + height + ')'" #xAxis/>
        <g class="y-axis" #yAxis/>
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
    .line-chart .y-axis .tick:not(:first-of-type) line {
      stroke: #777;
      stroke-dasharray: 2px;
      shape-rendering: crispEdges;
    }
  `],
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LineComponent implements OnInit {

  @Input() data: { date: Date, value: number }[] = [];

  margin = { top: 10, right: 10, bottom: 30, left: 30 };
  height = 100;
  width = 100;

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;
  @ViewChild('xAxis', { static: true })
  private xAxisRef: ElementRef;
  @ViewChild('yAxis', { static: true })
  private yAxisRef: ElementRef;
  @ViewChild('line', { static: true })
  private lineRef: ElementRef;

  private svg;
  private xAxis;
  private yAxis;
  private line;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.svg = d3.select(this.svgRef.nativeElement);
    this.xAxis = d3.select(this.xAxisRef.nativeElement);
    this.yAxis = d3.select(this.yAxisRef.nativeElement);
    this.line = d3.select(this.lineRef.nativeElement);
    setTimeout(() => this.render());
  }

  @HostListener('window:resize')
  render(): void {
    this.height = this.svgRef.nativeElement.clientHeight - this.margin.top - this.margin.bottom;
    this.width = this.svgRef.nativeElement.clientWidth - this.margin.left - this.margin.right;

    const x = d3.scaleTime()
      .domain(d3.extent(this.data, d => d.date))
      .range([0, this.width]).nice();

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.value)])
      .range([this.height, 0]).nice();

    this.xAxis.call(
      d3.axisBottom(x).ticks(10)
    );
    this.yAxis.call(
      d3.axisRight(y).tickSize(this.width + 10).ticks(10, 's')
    );
    this.yAxis.select('.domain').remove();
    this.yAxis.selectAll('.tick text').attr('x', -25).attr('dy', 0);

    const line = d3.line<{ date: Date, value: number }>()
      .defined(d => !isNaN(d.value))
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    this.line.datum(this.data).attr('d', line);

    this.cdr.markForCheck();
  }

}
