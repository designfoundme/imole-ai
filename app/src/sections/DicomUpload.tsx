import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Badge component not used in this version
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Scan,
  Brain,
  Timer,
  Bone
} from 'lucide-react';
import { SCAN_TYPE_CONFIG, BODY_PARTS, type ScanType, type DicomFile, type Patient } from '@/types';
import { cn } from '@/lib/utils';

const SCAN_ICONS: Record<ScanType, React.ElementType> = {
  xray: Bone,
  ct: Scan,
  mri: Brain,
  ultrasound: Activity,
};

const URGENCY_OPTIONS = [
  { value: 'routine', label: 'Routine', color: 'bg-slate-100 text-slate-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-amber-100 text-amber-700' },
  { value: 'stat', label: 'STAT', color: 'bg-red-100 text-red-700' },
] as const;

interface DicomUploadProps {
  onSuccess?: () => void;
}

export function DicomUpload({ onSuccess }: DicomUploadProps) {
  const { user } = useAuth();
  const { createCase } = useCases();
  
  const [files, setFiles] = useState<DicomFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form state
  const [scanType, setScanType] = useState<ScanType>('xray');
  const [bodyPart, setBodyPart] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [patientId, setPatientId] = useState('');
  const [referringPhysician, setReferringPhysician] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: DicomFile[] = acceptedFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      fileName: file.name,
      fileSize: file.size,
      uploadProgress: 0,
      status: 'uploading',
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, uploadProgress: 100, status: 'completed' }
              : f
          ));
        } else {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, uploadProgress: Math.round(progress) }
              : f
          ));
        }
      }, 200 + index * 100);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm'],
      'application/octet-stream': ['.dcm'],
    },
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const patient: Patient = {
      id: `patient-${Date.now()}`,
      name: patientName,
      age: parseInt(patientAge) || 0,
      gender: patientGender,
      patientId: patientId || `PID-${Date.now()}`,
      referringPhysician,
    };

    createCase({
      patient,
      diagnosticCenterId: user?.id || 'center-1',
      diagnosticCenterName: user?.name || 'Diagnostic Center',
      scanType,
      bodyPart,
      clinicalHistory,
      urgency,
      dicomFiles: files,
    });

    setIsUploading(false);
    setIsSubmitted(true);
    
    if (onSuccess) {
      setTimeout(onSuccess, 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const turnaroundHours = SCAN_TYPE_CONFIG[scanType].turnaroundHours;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful!</h2>
        <p className="text-slate-500 text-center max-w-md mb-6">
          Your case has been submitted and will be assigned to a radiologist shortly.
          Expected turnaround time: <strong>{turnaroundHours} hours</strong>
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Upload Another Case
          </Button>
          <Button onClick={() => onSuccess?.()}>
            View Cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scan Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Scan Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(SCAN_TYPE_CONFIG) as ScanType[]).map((type) => {
              const Icon = SCAN_ICONS[type];
              const config = SCAN_TYPE_CONFIG[type];
              const isSelected = scanType === type;
              
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScanType(type)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn(
                    'w-6 h-6 mb-2',
                    isSelected ? 'text-blue-600' : 'text-slate-400'
                  )} />
                  <p className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-blue-900' : 'text-slate-700'
                  )}>
                    {config.label}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Timer className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{config.turnaroundHours}h</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Hospital ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientAge">Age *</Label>
                <Input
                  id="patientAge"
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Years"
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Gender</Label>
                <Select value={patientGender} onValueChange={(v) => setPatientGender(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyPart">Body Part *</Label>
              <Select value={bodyPart} onValueChange={setBodyPart} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>{part}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referringPhysician">Referring Physician</Label>
              <Input
                id="referringPhysician"
                value={referringPhysician}
                onChange={(e) => setReferringPhysician(e.target.value)}
                placeholder="Dr. Name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Case Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <div className="flex gap-2">
                {URGENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUrgency(option.value as any)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                      urgency === option.value
                        ? option.color + ' ring-2 ring-offset-1'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalHistory">Clinical History / Indication *</Label>
              <Textarea
                id="clinicalHistory"
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                placeholder="Describe the patient's symptoms, relevant medical history, and reason for imaging..."
                rows={5}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Timer className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Expected Turnaround: {turnaroundHours} hours
                  </p>
                  <p className="text-xs text-blue-700">
                    For {SCAN_TYPE_CONFIG[scanType].label} scans under routine priority
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload DICOM Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-1">
              {isDragActive ? 'Drop files here' : 'Drag & drop DICOM files'}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              or click to browse from your computer
            </p>
            <p className="text-xs text-slate-400">
              Supports .dcm files up to 500MB per file
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.fileSize)}
                      </p>
                      {file.status === 'uploading' && (
                        <Progress value={file.uploadProgress} className="h-1 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <span className="text-xs text-slate-500">{file.uploadProgress}%</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={files.length === 0 || !patientName || !patientAge || !bodyPart || !clinicalHistory || isUploading}
        >
          {isUploading ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Case
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
