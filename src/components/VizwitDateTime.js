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
    const { totaledRows, filteredRows, onSelect, selected } = this.props
    const plotGroupItems = []

    this.totaledRowsDataset = new Plottable.Dataset(totaledRows)
      .metadata({ colorBucket: 5 })
    this.filteredRowsDataset = new Plottable.Dataset(filteredRows)
      .metadata({ colorBucket: 3 })

    const xScale = new Plottable.Scales.Time()
      .padProportion(0) // remove outer padding
    const xAxis = new Plottable.Axes.Time(xScale, 'bottom')

    const yScale = new Plottable.Scales.Linear()
    const colorScale = new Plottable.Scales.InterpolatedColor()
      .range(['#5279C7', '#BDCEF0'])

    this.plot = new Plottable.Plots.Area()
      .addDataset(this.totaledRowsDataset)
      .addDataset(this.filteredRowsDataset)
      .attr('fill', (datum, index, dataset) => dataset.metadata().colorBucket, colorScale)
      .x((datum) => new Date(datum.label), xScale)
      .y((datum) => datum.value, yScale)
      .animated(true)
    plotGroupItems.push(this.plot)

    const selectedData = (selected) ? [selected.value] : []
    this.selectedDataset = new Plottable.Dataset(selectedData)
    const rectangle = new Plottable.Plots.Rectangle()
      .addDataset(this.selectedDataset)
      .x((datum) => new Date(datum[0].value), xScale)
      .x2((datum) => new Date(datum[1].value))
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
          const prevSelected = this.props.selected
          if (prevSelected && prevSelected.value[0].value === firstLabel && prevSelected.value[1].value === lastLabel) {
            onSelect() // empty payload resets
          } else {
            const expression = {
              type: 'and',
              value: [
                { type: '>=', value: firstLabel },
                { type: '<=', value: lastLabel }
              ]
            }
            onSelect(expression)
          }
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
    if (this.props.totaledRows !== nextProps.totaledRows) {
      this.plot.animated(true)
      this.totaledRowsDataset.data(nextProps.totaledRows)
    }
    if (this.props.filteredRows !== nextProps.filteredRows) {
      this.plot.animated(false)
      this.filteredRowsDataset.data(nextProps.filteredRows)
    }
    if (this.props.selected !== nextProps.selected) {
      this.plot.animated(false)
      const selectedData = (nextProps.selected) ? [nextProps.selected.value] : []
      this.selectedDataset.data(selectedData)
    }
    return false
  }
}
