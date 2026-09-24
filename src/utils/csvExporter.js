import Papa from 'papaparse';

export function exportEventsToCSV(events, filename = 'thermal_anomalies_report.csv') {
  if (!events || events.length === 0) {
    alert('No events available to export.');
    return;
  }

  const exportData = events.map(e => ({
    'Event ID': e.eventId,
    'Satellite FIRMS ID': e.id,
    'Event Type': e.eventType,
    'State': e.state,
    'Facility Name': e.facilityName,
    'Latitude': e.latitude,
    'Longitude': e.longitude,
    'Risk Level': e.risk,
    'Risk Score': e.riskScore,
    'FRP (MW)': e.frp,
    'Brightness Ti4 (K)': e.bright_ti4,
    'Brightness Ti5 (K)': e.bright_ti5,
    'Confidence': e.confidence,
    'Acquisition Date': e.acq_date,
    'Acquisition Time': e.acq_time,
    'Satellite': e.satellite,
    'Instrument': e.instrument,
    'Distance to Facility (m)': e.dist_to_facility_m,
    'Status': e.status
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
