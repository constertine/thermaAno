import Papa from 'papaparse';

export function exportEventsToCSV(events, filename = 'thermal_anomalies_report.csv') {
  if (!events || events.length === 0) {
    alert('No events available to export.');
    return;
  }

  const exportData = events.map(e => ({
    'Event ID': e.eventId,
    'Grid Key': e.grid_key,
    'Model Predicted Class': e.model_predicted_class || e.predicted_class,
    'Prediction Confidence': e.prediction_confidence,
    'Heuristic Label': e.heuristic_label,
    'Event Type': e.eventType,
    'State': e.state,
    'Latitude': e.latitude,
    'Longitude': e.longitude,
    'Risk Level': e.risk,
    'Risk Score': e.riskScore,
    'Risk Score (API)': e.risk_score_api,
    'Risk Explanation': e.risk_explanation,
    'FRP (MW)': e.frp,
    'Brightness Ti4 (K)': e.bright_ti4,
    'Brightness Ti5 (K)': e.bright_ti5,
    'Confidence': e.confidence,
    'Confidence (Numeric)': e.confidence_numeric,
    'Acquisition Date': e.acq_date,
    'Acquisition Time': e.acq_time,
    'Satellite': e.satellite,
    'Instrument': e.instrument,
    'Day/Night': e.daynight,
    'Landcover': e.landcover_class,
    'Landcover Code': e.landcover_code,
    'Population Density': e.population_density,
    'Dist Industrial Zone (km)': e.dist_industrial_zone_km,
    'Dist Power Plant (km)': e.dist_power_plant_km,
    'Dist Quarry (km)': e.dist_quarry_km,
    'Dist Brick Kiln (km)': e.dist_brick_kiln_km,
    'Dist Oil & Gas (km)': e.dist_oil_gas_km,
    'Dist Waste Site (km)': e.dist_waste_site_km,
    'Recurrence Score': e.recurrence_score,
    'Recency Score': e.recency_score,
    'Trend Score': e.trend_score,
    'Stability Score': e.stability_score,
    'Persistence Confidence': e.persistence_confidence,
    'Site Detection Count': e.site_detection_count,
    'NDVI': e.ndvi,
    'NBR': e.nbr,
    'SAR Backscatter Delta': e.sar_backscatter_delta,
    'Top SHAP Feature': e.top_shap_feature,
    'Top SHAP Impact': e.top_shap_impact,
    'Prob Agricultural Burning': e.class_probabilities?.["Agricultural Burning"],
    'Prob Brick Kiln': e.class_probabilities?.["Brick Kiln"],
    'Prob Industrial': e.class_probabilities?.["Industrial"],
    'Prob Mining/Extraction': e.class_probabilities?.["Mining/Extraction"],
    'Prob Other/Unknown': e.class_probabilities?.["Other/Unknown"],
    'Prob Waste/Landfill': e.class_probabilities?.["Waste/Landfill"],
    'Prob Wildfire': e.class_probabilities?.["Wildfire"],
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
