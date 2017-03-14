import React from 'react'
import {Bar} from 'react-chartjs-2'

const colors = {
  active: 'rgba(33, 118, 210, 0.2)', // ben-franklin-blue
  inactive: 'rgba(33, 118, 210, 0.03)',
  border: 'rgba(15, 77, 144, 1)'
}

export default class BarChart extends React.Component {
  render () {
    const { totalRows, filteredRows } = this.props
    const isFiltered = (filteredRows.length > 0)
    const chartData = {
      labels: totalRows.map((row) => row.label),
      datasets: [
        {
          label: 'Total',
          data: totalRows.map((row) => row.value),
          backgroundColor: isFiltered ? colors.inactive : colors.active,
          borderColor: colors.border,
          borderWidth: 1
        }
      ]
    }

    if (isFiltered) {
      chartData.datasets.push({
        label: 'Filtered',
        data: filteredRows.map((row) => row.value),
        backgroundColor: colors.active,
        borderColor: colors.border,
        borderWidth: 1
      })
    }

    const options = {
      maintainAspectRatio: false,
      tooltips: {
        mode: 'x-axis'
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          stacked: true
        }]
      }
    }

    return <Bar
            data={chartData}
            options={options}
            width={600}
            height={500}
            getElementAtEvent={this.onClick.bind(this)} />
  }

  onClick (elements) {
    if (elements.length) {
      const index = elements[0]._index
      const label = this.props.totalRows[index].label
      this.props.onSelect(label)
    }
  }
}
