module.exports = {
	panels: [
		// First row
		[
			{
				title: 'Issue Date & Time',
				chartType: 'datetime',
				domain: 'data.phila.gov',
				dataset: '2pfz-fnns',
				groupBy: 'date_trunc_ym(issue_date_and_time)',
				triggerField: 'issue_date_and_time' // when clicked, what field does this trigger on other charts?
			},
			{
				title: 'Zipcodes',
				chartType: 'choropleth',
				domain: 'data.phila.gov',
				dataset: '2pfz-fnns',
				groupBy: ':@computed_region_8tb6_tjh9',
				
				// Map polygon boundaries
				boundaries: 'https://data.phila.gov/resource/8tb6-tjh9.geojson',
				boundariesLabel: 'code',
				boundariesId: '_feature_id'
			}
		],
		// Second row
		[
			{
				title: 'Violation Description',
				chartType: 'bar',
				domain: 'data.phila.gov',
				dataset: '2pfz-fnns',
				groupBy: 'violation_description'
			},
			{
				title: 'Issuing Agency',
				chartType: 'bar',
				domain: 'data.phila.gov',
				dataset: '2pfz-fnns',
				groupBy: 'issuing_agency'
			}
		],
		// Third row
		[
			{
				// Table
				chartType: 'table',
				domain: 'data.phila.gov',
				dataset: '2pfz-fnns',
				padded: true
			}
		]
	]
}