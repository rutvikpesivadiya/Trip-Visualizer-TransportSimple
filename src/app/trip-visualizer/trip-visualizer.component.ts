import { Component, AfterViewInit, OnInit, HostListener } from '@angular/core';
import * as d3 from 'd3';

interface Trip {
  from: string;
  to: string;
  level: number;
  continued: boolean;
}

@Component({
  selector: 'app-trip-visualizer',
  templateUrl: './trip-visualizer.component.html',
})
export class TripVisualizerComponent implements AfterViewInit, OnInit {
  from = '';
  to = '';
  trips: Trip[] = [
    { from: 'BLR', to: 'MAA', continued: false, level: 1 }, // Arrowed - not continued
    { from: 'MAA', to: 'HYD', continued: true, level: 1 }, // Straight - continued
    { from: 'HYD', to: 'DEL', continued: true, level: 1 }, // Straight - continued
    { from: 'DEL', to: 'BLR', continued: false, level: 1 }, // Arrowed - not continued
    { from: 'BLR', to: 'MAA', continued: false, level: 2 }, // Same from-to as 1st trip → Level 2
    { from: 'MAA', to: 'HYD', continued: true, level: 2 }, // Same from-to as 2nd → Level 2
    { from: 'HYD', to: 'GOA', continued: true, level: 1 }, // New trip from last → continued
    { from: 'DEL', to: 'DEL', continued: false, level: 2 }, // Same from-to → Level 2
  ];

  errorMessage = '';
  svgWidth = 0;
  nodeSpacing = 100; // Balanced spacing between nodes

  ngOnInit(): void {
    this.updateSvgWidth();
  }

  ngAfterViewInit(): void {
    this.draw();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateSvgWidth();
    this.draw();
  }

  updateSvgWidth(): void {
    // Calculate required width based on number of trips and node spacing
    this.svgWidth = Math.max(800, this.trips.length * this.nodeSpacing + 100);
  }

  addTrip(): void {
    this.errorMessage = '';
    const fromCode = this.from.trim().slice(0, 3).toUpperCase();
    const toCode = this.to.trim().slice(0, 3).toUpperCase();

    if (!fromCode || !toCode) {
      this.errorMessage = 'Please enter both start and end points';
      return;
    }

    let level = 1;
    let continued = false;

    const last = this.trips[this.trips.length - 1];

    if (last && last.to === fromCode) {
      continued = true;
    } else {
      // Check if this trip already exists
      const existingTrip = this.trips.find(
        (t) => t.from === fromCode && t.to === toCode
      );
      if (existingTrip) {
        level = 2;
      }
    }

    this.trips.push({ from: fromCode, to: toCode, level, continued });
    this.from = '';
    this.to = '';

    this.updateSvgWidth();
    this.draw();
  }

  removeTrip(index: number): void {
    this.trips.splice(index, 1);

    // Recalculate continued status and levels for all trips
    this.recalculateTrips();

    this.updateSvgWidth();
    this.draw();
  }

  recalculateTrips(): void {
    if (this.trips.length === 0) return;

    // First trip is never continued
    this.trips[0].continued = false;

    // Process all trips to recalculate continued status and levels
    for (let i = 0; i < this.trips.length; i++) {
      const current = this.trips[i];

      // Reset level to 1 initially
      current.level = 1;

      // Check for continued status (except first trip)
      if (i > 0) {
        const previous = this.trips[i - 1];
        current.continued = previous.to === current.from;
      }

      // Check for duplicate trips (same from-to pairs)
      for (let j = 0; j < i; j++) {
        if (
          this.trips[j].from === current.from &&
          this.trips[j].to === current.to
        ) {
          current.level = 2;
          break;
        }
      }
    }
  }

  draw(): void {
    const svg = d3.select('#tripSvg');
    svg.selectAll('*').remove();

    // Set SVG width based on number of trips
    svg.attr('width', this.svgWidth);

    // Create modern arrow marker
    const defs = svg.append('defs');

    // Arrow for level 1
    defs
      .append('marker')
      .attr('id', 'arrow-level1')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#333');

    // Arrow for level 2
    defs
      .append('marker')
      .attr('id', 'arrow-level2')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#888');

    const height = 200;
    const startX = 50;
    const level1Y = 70;
    const level2Y = 140;

    // Track level changes to add curved connectors
    let prevLevel = this.trips.length > 0 ? this.trips[0].level : 1;

    // Draw trips
    this.trips.forEach((trip, i) => {
      const x1 = startX + i * this.nodeSpacing;
      const x2 = x1 + (this.nodeSpacing - 20);
      const y = trip.level === 2 ? level2Y : level1Y;

      // Add curved connector if level changes
      if (i > 0 && trip.level !== prevLevel) {
        const prevX = startX + (i - 1) * this.nodeSpacing;
        const prevY = prevLevel === 2 ? level2Y : level1Y;

        // Create curved path between levels
        const path = d3.path();
        path.moveTo(prevX + 20, prevY); // Start a bit to the right of the previous node
        path.bezierCurveTo(
          prevX + 40,
          prevY, // First control point
          x1 - 40,
          y, // Second control point
          x1 - 20,
          y // End point (a bit to the left of current node)
        );

        svg
          .append('path')
          .attr('d', path.toString())
          .attr('fill', 'none')
          .attr('stroke', '#aaa')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,2');
      }

      prevLevel = trip.level;

      // Circles (centered on the line)
      svg
        .append('circle')
        .attr('cx', x1)
        .attr('cy', y)
        .attr('r', 7)
        .attr(
          'fill',
          trip.level === 2 ? '#888' : trip.continued ? '#3b82f6' : '#f59e0b'
        )
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      // Lines
      svg
        .append('line')
        .attr('x1', x1)
        .attr('y1', y)
        .attr('x2', x2)
        .attr('y2', y)
        .attr('stroke', trip.level === 2 ? '#888' : '#333')
        .attr('stroke-width', 2)
        .attr(
          'marker-end',
          trip.continued
            ? null
            : trip.level === 2
            ? 'url(#arrow-level2)'
            : 'url(#arrow-level1)'
        );

      // Text Labels
      svg
        .append('text')
        .attr('x', x1)
        .attr('y', y - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#444')
        .text(`${trip.from} - ${trip.to}`);

      // Add remove button
      const buttonGroup = svg
        .append('g')
        .attr('class', 'remove-button')
        .attr('transform', `translate(${x1}, ${y + 20})`)
        .style('cursor', 'pointer')
        .on('click', () => this.removeTrip(i));

      buttonGroup.append('circle').attr('r', 8).attr('fill', '#f87171');

      buttonGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text('×');
    });

    // Add legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${startX}, 20)`);

    // Level 1 continued
    legend
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 7)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    legend
      .append('text')
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '12px')
      .text('Level 1 (Continued)');

    // Level 1 not continued
    legend
      .append('circle')
      .attr('cx', 150)
      .attr('cy', 0)
      .attr('r', 7)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    legend
      .append('text')
      .attr('x', 165)
      .attr('y', 4)
      .attr('font-size', '12px')
      .text('Level 1 (Not Continued)');

    // Level 2
    legend
      .append('circle')
      .attr('cx', 320)
      .attr('cy', 0)
      .attr('r', 7)
      .attr('fill', '#888')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    legend
      .append('text')
      .attr('x', 335)
      .attr('y', 4)
      .attr('font-size', '12px')
      .text('Level 2 (Duplicate Trip)');
  }
}
