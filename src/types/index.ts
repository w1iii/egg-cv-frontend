/** External-quality decision. Separate from the commercial size grade. */
export type Decision = 'Acceptable' | 'Reject' | 'Needs Review';
/** Commercial size grade. Reject is a decision, never a grade. */
export type Grade = 'A' | 'B' | 'C' | 'N/A';
export type Size = 'Small' | 'Medium' | 'Large' | 'Unknown';
export type DamageStatus = 'Damaged' | 'Not Damaged' | 'Needs Review';
export type CleanlinessStatus =
  | 'Clean'
  | 'Stained'
  | 'Needs Review'
  | 'Unavailable'
  | 'Unknown';

export interface EggConfidence {
  detection: number;
  damage?: number | null;
  cleanliness?: number | null;
}

export interface EggGeometry {
  length_mm?: number | null;
  breadth_mm?: number | null;
  quality?: string | null;
}

export interface ModelVersions {
  detector?: string | null;
  damage?: string | null;
  cleanliness?: string | null;
  calibration?: string | null;
}

export interface DetectionBox {
  id: number;
  prediction_id: number;
  egg_id?: number | null;
  class_name: string;
  confidence: EggConfidence;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  annotated: boolean;
  /** Null only for inspections recorded before decisions existed. */
  decision?: Decision | null;
  /** Semicolon-separated reason codes explaining the decision. */
  decision_reason?: string | null;
  grade?: Grade | null;
  size?: Size | null;
  weight_g?: number | null;
  damage_status?: DamageStatus | null;
  cleanliness_status?: CleanlinessStatus | null;
  requires_review: boolean;
  review_reason?: string | null;
  geometry: EggGeometry;
  model_versions: ModelVersions;
}

export interface CalibrationInfo {
  status?: 'available' | 'unavailable' | string;
  reason?: string | null;
  mm_per_pixel?: number | null;
}

export interface ImageQualityInfo {
  width?: number;
  height?: number;
  sharpness?: number;
  reasons?: string[];
}

/** Known keys of Prediction.inference_metadata; legacy rows may lack any. */
export interface InspectionMetadata {
  decision_policy_version?: string;
  cleanliness_model_available?: boolean;
  cleanliness_release_approved?: boolean;
  calibration?: CalibrationInfo;
  sizing_available?: boolean;
  size_calibrated?: boolean;
  size_grades_approved?: boolean;
  detection_count_status?: 'empty' | 'ok';
  raw_detection_count?: number;
  duplicate_boxes_removed?: number;
  invalid_boxes_removed?: number;
  image_quality?: ImageQualityInfo;
  review_reason_counts?: Record<string, number>;
  annotation_error?: string | null;
  [key: string]: unknown;
}

/** One inspection: a single uploaded or captured still image. */
export interface Prediction {
  id: number;
  file_name: string;
  file_type: string;
  inspection_code: string;
  captured_at?: string | null;
  operator?: string | null;
  inference_metadata?: InspectionMetadata | null;
  status: string;
  error_message?: string | null;
  total_detections: number;
  acceptable_count: number;
  reject_count: number;
  needs_review_count: number;
  damaged_count: number;
  not_damaged_count: number;
  processing_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
  /** Null marks a legacy inspection recorded before decisions. */
  decision_policy_version: string | null;
}

export interface PredictionDetail extends Prediction {
  result_json: Record<string, unknown> | null;
  annotated_path: string | null;
  annotated_url: string | null;
  detection_boxes: DetectionBox[];
}

export interface DashboardStats {
  total_predictions: number;
  total_images: number;
  total_detections: number;
  acceptable_count: number;
  reject_count: number;
  needs_review_count: number;
  undecided_count: number;
  damaged_percentage: number;
  avg_processing_time_ms: number;
  recent_predictions: Prediction[];
}

export interface ModelInfo {
  loaded: boolean;
  file?: string | null;
  sha256?: string | null;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  damage_model_loaded: boolean;
  cleanliness_model_loaded: boolean;
  cleanliness_release_approved: boolean;
  size_grades_approved: boolean;
  weight_estimation_enabled: boolean;
  database_connected: boolean;
  models?: Record<string, ModelInfo>;
}

export interface GradeDistribution {
  grade_a: number;
  grade_b: number;
  grade_c: number;
  grade_na: number;
  total: number;
}

export interface DecisionDistribution {
  acceptable: number;
  reject: number;
  needs_review: number;
  undecided: number;
  total: number;
}

export interface InspectionFilters {
  decision?: Decision;
  review_reason?: string;
}

export interface CapturedFrame {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}
