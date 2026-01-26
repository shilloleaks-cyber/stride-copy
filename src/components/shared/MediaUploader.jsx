import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Image, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MediaUploader({ 
  onImageUpload, 
  onVideoUpload, 
  currentImage, 
  currentVideo,
  onRemoveImage,
  onRemoveVideo,
  allowVideo = true,
  className = ""
}) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onImageUpload(file_url);
    setIsUploadingImage(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onVideoUpload(file_url);
    setIsUploadingVideo(false);
  };

  return (
    <div className={className}>
      {/* Upload Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage || !!currentImage}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          {isUploadingImage ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Image className="w-4 h-4 mr-1" />
          )}
          รูปภาพ
        </Button>

        {allowVideo && (
          <>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              disabled={isUploadingVideo || !!currentVideo}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              {isUploadingVideo ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Video className="w-4 h-4 mr-1" />
              )}
              วิดีโอ
            </Button>
          </>
        )}
      </div>

      {/* Preview */}
      {(currentImage || currentVideo) && (
        <div className="space-y-3">
          {currentImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-xl overflow-hidden border border-emerald-500/30"
            >
              <img 
                src={currentImage} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {currentVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-xl overflow-hidden border border-purple-500/30"
            >
              <video 
                src={currentVideo} 
                controls
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={onRemoveVideo}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}