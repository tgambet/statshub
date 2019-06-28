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
  selector: 'charts4ng-chords',
  template: `
    <svg class="chords" #svg [attr.viewBox]="(- width / 2) + ' ' + (- height / 2) + ' ' + width + ' ' + height">
      <g class="ribbons">
        <path *ngFor="let chord of chords" [attr.d]="ribbon(chord)" [attr.fill]="color(chord.source.index)"></path>
      </g>
      <g class="groups">
        <g class="group" *ngFor="let group of chords.groups">
          <path [attr.fill]="color(group.index)" [attr.d]="arc(group)"></path>
          <g class="ticks">
            <g class="tick" *ngFor="let tick of groupTicks(group, 1e3); let i = index" [attr.transform]="tickTransform(tick)">
              <line x2="4" stroke="currentColor"></line>
              <text x="6" dy=".35em"
                    *ngIf="i !== 0 && i % 5 === 0"
                    [attr.transform]="tick.angle > PI ? 'rotate(180) translate(-12)' : null"
                    [attr.text-anchor]="tick.angle > PI ? 'end' : null">
                {{ format(tick.value) }}
              </text>
            </g>
          </g>
          <g class="group-legend" fill="blue">
            <text text-anchor="middle" dy=".35em">{{ getLegend(group.index) }}</text>
          </g>
        </g>
      </g>
    </svg>
  `,
  styles: [`
    .chords {
      height: 100%;
      width: 100%;
      font: 6px 'Roboto';
      color: currentColor;
    }
    .chords text {
      fill: currentColor;
      font-weight: 300;
    }
    .chords .groups:hover .group:not(:hover) {
      opacity: 0.5;
    }
    .chords .ribbons path {
      opacity: 0.5;
    }
    .chords .ribbons path:hover {
      opacity: 1;
    }
    .chords .group-legend {
      display: none;
    }
    .chords .group-legend text {
      font-size: 10px;
      text-shadow: 0 0 1px black, 0 0 1px black;
      font-weight: 400;
    }
    .chords .group:hover .group-legend {
      display: unset;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChordsComponent implements OnInit, OnChanges {

  @Input() data: number[][] = [];
  @Input() legend: { name: string, color: string }[] = [];

  @ViewChild('svg', { static: true })
  private svgRef: ElementRef;

  height = 100;
  width = 100;
  innerRadius = 90;
  outerRadius = 100;

  PI = Math.PI;

  chord: d3.ChordLayout;
  chords: d3.Chords;
  arc;
  ribbon;
  format;
  color;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.init();
    this.update();
    setTimeout(() => this.update());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.sort || changes.data && !changes.data.isFirstChange()) {
      this.update();
    }
  }

  init() {
    this.chord = d3.chord()
      .padAngle(0.025)
      .sortSubgroups(d3.descending);

    this.format = d3.formatPrefix(',.0', 1e3);
  }

  @HostListener('window:resize')
  update() {
    this.height = this.svgRef.nativeElement.clientHeight;
    this.width = this.svgRef.nativeElement.clientWidth;

    this.outerRadius = Math.min(this.width, this.height) * 0.5 - 20;
    this.innerRadius = this.outerRadius - 10;

    this.chords = this.chord(this.data);

    this.arc = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius);

    this.ribbon = d3.ribbon()
      .radius(Math.max(0, this.innerRadius - 1));

    this.color = d3.scaleOrdinal<number, {}>()
      .domain(d3.range(this.legend.length))
      .range(this.legend.map(l => l.color));

    setTimeout(() => this.generateLabels());

    this.cdr.markForCheck();
  }

  groupTicks(d, step) {
    const k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map(value => {
      return { value, angle: value * k + d.startAngle };
    });
  }

  tickTransform(d) {
    return `rotate(${d.angle * 180 / Math.PI - 90}) translate(${this.outerRadius},0)`;
  }

  getLegend(i: number) {
    return this.legend[i].name;
  }

  generateLabels() {
    d3.selectAll('.chords .group-legend').nodes().forEach((group: Element, index: number) => {
      const textNode = d3.select(group).select('text').node();
      const bbox = (textNode as SVGGraphicsElement).getBBox();
      const padding = 4;
      d3.select(group).insert('rect', 'text')
        .attr('rx', 2)
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + (padding * 2))
        .attr('height', bbox.height + (padding * 2))
        .style('fill', this.legend[index].color);
    });
  }

}
