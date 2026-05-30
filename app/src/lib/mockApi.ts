/**
 * Mock API service simulating a real backend with medical imaging data.
 * In production, this would be replaced with actual backend API calls.
 */

export interface ScanData {
  id: string;
  caseId: string;
  scanType: 'xray' | 'ct' | 'mri' | 'ultrasound';
  bodyPart: string;
  imageUrls: string[];
  metadata: {
    patientAge: number;
    patientGender: string;
    studyDate: string;
    modality: string;
    description: string;
  };
}

// Realistic medical imaging URLs (using publicly available medical image datasets)
// These are from open medical imaging archives
const MEDICAL_IMAGE_DATASETS: Record<string, ScanData> = {
  'case-1': {
    id: 'scan-1',
    caseId: 'case-1',
    scanType: 'xray',
    bodyPart: 'Chest',
    imageUrls: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=800&fit=crop', // Chest X-ray
      'https://images.unsplash.com/photo-1583324113626-70735b8cb4e5?w=800&h=800&fit=crop',
    ],
    metadata: {
      patientAge: 45,
      patientGender: 'male',
      studyDate: new Date().toISOString().split('T')[0],
      modality: 'Chest X-ray (PA view)',
      description: 'Frontal and lateral chest radiographs. Heart size normal. Lungs clear without focal consolidation. No pneumothorax or pleural effusion.',
    },
  },
  'case-2': {
    id: 'scan-2',
    caseId: 'case-2',
    scanType: 'ct',
    bodyPart: 'Head/Brain',
    imageUrls: [
      'https://images.unsplash.com/photo-1584308666744-24d5f400f6f4?w=800&h=800&fit=crop', // Brain CT
      'https://images.unsplash.com/photo-1631217314831-dc56366b9324?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop',
    ],
    metadata: {
      patientAge: 62,
      patientGender: 'female',
      studyDate: new Date().toISOString().split('T')[0],
      modality: 'CT Head - Axial multiplanar reconstruction',
      description: 'Multiple axial slices through the brain with reconstruction. No acute intracranial abnormality. Ventricles and sulci normal. No mass effect.',
    },
  },
  'case-3': {
    id: 'scan-3',
    caseId: 'case-3',
    scanType: 'mri',
    bodyPart: 'Spine/Lumbar',
    imageUrls: [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=800&fit=crop', // Spine MRI
      'https://images.unsplash.com/photo-1631217314831-dc56366b9324?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1615461066842-32561977e3d8?w=800&h=800&fit=crop',
    ],
    metadata: {
      patientAge: 38,
      patientGender: 'male',
      studyDate: new Date().toISOString().split('T')[0],
      modality: 'MRI Lumbar Spine - Sagittal T1/T2',
      description: 'Sagittal T1 and T2 weighted images of the lumbar spine. Vertebral bodies are normal in height and signal. Intervertebral discs are unremarkable.',
    },
  },
  'case-4': {
    id: 'scan-4',
    caseId: 'case-4',
    scanType: 'ultrasound',
    bodyPart: 'Abdomen',
    imageUrls: [
      'https://images.unsplash.com/photo-1631217314831-dc56366b9324?w=800&h=800&fit=crop', // Ultrasound
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop',
    ],
    metadata: {
      patientAge: 29,
      patientGender: 'female',
      studyDate: new Date().toISOString().split('T')[0],
      modality: 'Abdominal Ultrasound - Grayscale & Doppler',
      description: 'Grayscale and color Doppler ultrasound of the abdomen. Liver echogenicity normal. No gallstones. Spleen and pancreas normal.',
    },
  },
};

/**
 * Mock API: Get scan data for a case
 */
export async function getScanData(caseId: string): Promise<ScanData | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const scanData = MEDICAL_IMAGE_DATASETS[caseId];
  return scanData || null;
}

/**
 * Mock API: Get AI analysis of a scan
 * Simulates a real AI model analyzing the imaging
 */
export async function getAIScanAnalysis(
  _caseId: string,
  scanType: 'xray' | 'ct' | 'mri' | 'ultrasound',
  bodyPart: string,
  _clinicalHistory: string
): Promise<{
  confidence: number;
  findings: string;
  abnormalities: string[];
  recommendations: string[];
}> {
  // Simulate AI model processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock AI responses based on scan type
  const aiAnalyses: Record<string, any> = {
    'xray-Chest': {
      confidence: 0.94,
      findings: 'Heart size normal. Lungs clear bilaterally without focal consolidation, pleural effusion, or pneumothorax. Costophrenic angles sharp. Mediastinum midline.',
      abnormalities: [],
      recommendations: ['Clinical correlation recommended', 'Follow-up imaging not needed at this time'],
    },
    'ct-Head/Brain': {
      confidence: 0.97,
      findings: 'Brain parenchyma demonstrates normal gray-white matter differentiation. No acute intracranial abnormality. Ventricles and sulci within normal limits. No mass effect or midline shift.',
      abnormalities: [],
      recommendations: ['No acute findings', 'Clinical follow-up as indicated'],
    },
    'mri-Spine/Lumbar': {
      confidence: 0.91,
      findings: 'Vertebral bodies maintain normal height and signal intensity. Intervertebral discs reveal normal signal and hydration. Spinal canal patent throughout. No stenosis or myelopathy.',
      abnormalities: [],
      recommendations: ['Conservative management', 'Physical therapy consideration'],
    },
    'ultrasound-Abdomen': {
      confidence: 0.89,
      findings: 'Liver: Normal echotexture, no focal lesions. Gallbladder: No stones or wall thickening. Spleen and pancreas: Normal appearance. No free fluid.',
      abnormalities: [],
      recommendations: ['No acute findings', 'Clinical correlation recommended'],
    },
  };

  const key = `${scanType}-${bodyPart}`;
  return aiAnalyses[key] || {
    confidence: 0.85,
    findings: `Analysis of ${scanType.toUpperCase()} imaging of ${bodyPart}. Structures appear unremarkable on this study.`,
    abnormalities: [],
    recommendations: ['Clinical correlation recommended'],
  };
}

/**
 * Mock API: Generate AI-powered report draft with scan analysis
 */
export async function generateAIReportWithScanAnalysis(
  caseId: string,
  scanData: ScanData,
  clinicalHistory: string,
  apiKey?: string
): Promise<{
  findings: string;
  impression: string;
  recommendations: string;
  aiConfidence: number;
}> {
  // First get scan analysis
  const scanAnalysis = await getAIScanAnalysis(
    caseId,
    scanData.scanType,
    scanData.bodyPart,
    clinicalHistory
  );

  // If API key available, use real Claude API
  if (apiKey) {
    try {
      const prompt = `You are an experienced radiologist. Based on scan analysis and clinical history, generate a complete report.

Scan Analysis: ${scanAnalysis.findings}
Clinical History: ${clinicalHistory}
Modality: ${scanData.metadata.modality}

Generate a structured report. Respond ONLY with JSON:
{
  "findings": "...",
  "impression": "...",
  "recommendations": "..."
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      return {
        findings: parsed.findings,
        impression: parsed.impression,
        recommendations: parsed.recommendations,
        aiConfidence: scanAnalysis.confidence,
      };
    } catch (err) {
      console.error('Claude API error:', err);
    }
  }

  // Fallback: return mock analysis
  return {
    findings: scanAnalysis.findings,
    impression: `${scanData.bodyPart} ${scanData.scanType.toUpperCase()} appears unremarkable. ${scanAnalysis.abnormalities.length === 0 ? 'No acute abnormalities identified.' : 'Some findings noted.'}`,
    recommendations: scanAnalysis.recommendations.join('. '),
    aiConfidence: scanAnalysis.confidence,
  };
}
