import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'charts4ng-pie',
  template: `
    <svg class="pie-chart" #svg [attr.viewBox]="'0 0 ' + width + ' ' + height" text-anchor="middle">
      <g class="pie" #pie [attr.transform]="'translate(' + (width / 2) + ', ' + (height / 2) + ')'">
      </g>
    </svg>
  `,
  styles: [`
    .pie-chart {
      height: 100%;
      width: 100%;
      font: 10px sans-serif;
    }
    .pie-chart title {
      background-color: #0074D9;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieComponent implements OnInit {

  @Input() data: any[] = [];
  @Input() sort: (a: any, b: any) => number = null;
  @Input() selector: (a: any) => number;

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;
  @ViewChild('pie', { static: true })
  private pieRef: ElementRef;

  height = 100;
  width = 100;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    setTimeout(() => this.init());
  }

  init() {
    this.height = this.svgRef.nativeElement.clientHeight;
    this.width = this.svgRef.nativeElement.clientWidth;

    this.cdr.markForCheck();

    this.data.sort(this.sort);

    const pie = d3.pie<any>()
      .padAngle(0.0075)
      // .sort((a, b) => b.publishedAt - a.publishedAt)
      .value(this.selector);

    const radius = Math.min(this.width, this.height) / 2;
    const arc = d3.arc<{}>()
      .innerRadius(radius * 0.67)
      .outerRadius(radius - 1)
      .cornerRadius(2.5);

    const arcs = pie(this.data);

    const color = d3.scaleOrdinal<any>()
      .domain(this.data.map(d => this.selector(d).toString()))
      .range(d3.quantize(t => d3.interpolateRgb('#64dd17', '#fff')(t), this.data.length));

    d3.select(this.pieRef.nativeElement)
      .selectAll('path')
      .data(arcs)
      .join('path')
      .attr('fill', d => color(this.selector(d.data).toString()))
      .attr('d', arc)
      .append('title')
      .text(d => `${d.data.tagName}: ${this.selector(d.data).toLocaleString()}`)
      .transition();
  }

}
