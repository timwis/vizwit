import { Component } from 'preact'
import { sortBy, first, last } from 'lodash'
import Plottable from 'plottable'
import 'plottable/plottable.css'

export default class VizwitDateTime extends Component {
  render () {
    const style = { height: 400 }
    const saveRef = (el) => (this.container = el)
    return <div ref={saveRef} style={style} />
  }
  componentDidMount () {
    const { totals, filtered, onSelect } = this.props

    this.totalsDataset = new Plottable.Dataset(totals).metadata(5)
    this.filteredDataset = new Plottable.Dataset(filtered).metadata(3)

    const xScale = new Plottable.Scales.Time()
      .domain([new Date(2006, 0, 1), new Date(2017, 11, 31)])
    const yScale = new Plottable.Scales.Linear()
    const colorScale = new Plottable.Scales.InterpolatedColor()
    colorScale.range(['#5279C7', '#BDCEF0'])

    const xAxis = new Plottable.Axes.Time(xScale, 'bottom')

    this.plot = new Plottable.Plots.Area()
      .addDataset(this.totalsDataset)
      .addDataset(this.filteredDataset)
      .attr('fill', (d, i, dataset) => dataset.metadata(), colorScale)
      .x((d) => new Date(d.label), xScale)
      .y((d) => d.value, yScale)
      .animated(true)

    let group
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
      group = new Plottable.Components.Group([dragbox, this.plot])
    }

    new Plottable.Components.Table([
      [group || this.plot],
      [xAxis]
    ]).renderTo(this.container)
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
    return false
  }
}
