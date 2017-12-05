import { Component } from 'preact'
import { sortBy, first, last } from 'lodash'
import Plottable from 'plottable'
import 'plottable/plottable.css'

import { arrayify } from '../helpers'

export default class VizwitDateTime extends Component {
  render () {
    const style = { height: 400 }
    const saveRef = (el) => (this.container = el)
    return <div ref={saveRef} style={style} />
  }
  componentDidMount () {
    const { totals, filtered, onSelect, selected } = this.props
    const plotGroupItems = []

    this.totalsDataset = new Plottable.Dataset(totals)
      .metadata({ colorBucket: 5 })
    this.filteredDataset = new Plottable.Dataset(filtered)
      .metadata({ colorBucket: 3 })

    const xScale = new Plottable.Scales.Time()
      .domain([new Date(2006, 0, 1), new Date(2017, 11, 31)])
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom')

    const yScale = new Plottable.Scales.Linear()
    const colorScale = new Plottable.Scales.InterpolatedColor()
      .range(['#5279C7', '#BDCEF0'])

    this.plot = new Plottable.Plots.Area()
      .addDataset(this.totalsDataset)
      .addDataset(this.filteredDataset)
      .attr('fill', (datum, index, dataset) => dataset.metadata().colorBucket, colorScale)
      .x((datum) => new Date(datum.label), xScale)
      .y((datum) => datum.value, yScale)
      .animated(true)
    plotGroupItems.push(this.plot)

    this.selectedDataset = new Plottable.Dataset(arrayify(selected))
    const rectangle = new Plottable.Plots.Rectangle()
      .addDataset(this.selectedDataset)
      .x((datum) => new Date(datum[0]), xScale)
      .x2((datum) => new Date(datum[1]))
      .y(0)
      .y2((datum) => rectangle.height())
      .attr('fill', '#f99300')
      .attr('opacity', 0.3)
    plotGroupItems.push(rectangle)

    if (onSelect) {
      const dragbox = new Plottable.Components.XDragBoxLayer()
      dragbox.onDragEnd((box) => {
        const entities = this.plot.entitiesIn(box)
        if (entities.length >= 2) {
          // TODO: Is there a way for entitiesIn() to return this sorted?
          const sortedEntities = sortBy(entities, (entity) => entity.datum.label)
          const firstLabel = first(sortedEntities).datum.label
          const lastLabel = last(sortedEntities).datum.label
          onSelect([firstLabel, lastLabel])
        }
      })
      plotGroupItems.push(dragbox)
    }

    const group = new Plottable.Components.Group(plotGroupItems)
    const table = new Plottable.Components.Table([
      [group || this.plot],
      [xAxis]
    ])

    table.renderTo(this.container)
  }
  shouldComponentUpdate (nextProps) {
    if (this.props.totals !== nextProps.totals) {
      this.plot.animated(true)
      this.totalsDataset.data(nextProps.totals)
    }
    if (this.props.filtered !== nextProps.filtered) {
      this.plot.animated(false)
      this.filteredDataset.data(nextProps.filtered)
    }
    if (this.props.selected !== nextProps.selected) {
      this.plot.animated(false)
      this.selectedDataset.data(arrayify(nextProps.selected))
    }
    return false
  }
}
