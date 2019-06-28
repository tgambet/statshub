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
      <g *ngFor="let group of chords.groups">
        <path fill="red" [attr.d]="arc(group)"></path>
        <g>
          <g *ngFor="let tick of groupTicks(group, 1e3); let i = index" [attr.transform]="tickTransform(tick)">
            <line x2="4" stroke="currentColor"></line>
            <text x="6" dy=".35em"
                  *ngIf="i % 5 === 0"
                  [attr.transform]="tick.angle > PI ? 'rotate(180) translate(-12)' : null"
                  [attr.text-anchor]="tick.angle > PI ? 'end' : null">
              {{ format(tick.value) }}
            </text>
          </g>
        </g>
      </g>
      <g fill-opacity="0.67">
        <path *ngFor="let chord of chords" [attr.d]="ribbon(chord)" fill="steelblue"></path>
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
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChordsComponent implements OnInit, OnChanges {

  @Input() data: number[][] = [];

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
    this.innerRadius = this.outerRadius - 5;

    this.chords = this.chord(this.data);

    this.arc = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius);

    this.ribbon = d3.ribbon()
      .radius(Math.max(0, this.innerRadius));

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

}
