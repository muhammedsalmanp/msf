
import Slide from '../../models/Slide.js';
import { uploadFileToS3, deleteFileFromS3 } from '../../config/awsS3Helper.js';





export const getSlides = async (req, res) => {
  try {
    const slides = await Slide.find().sort({ createdAt: -1 }).limit(7);
    res.json(slides);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch slides' });
  }
};

export const uploadSlide = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });


    const { key, url } = await uploadFileToS3('slides/', file);

    const slide = new Slide({ imageUrl: url });

    await slide.save();

    res.status(201).json({ message: 'Slide uploaded successfully', imageUrl: url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Failed to upload slide' });
  }
};


export const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await Slide.findById(id);
    if (!slide) return res.status(404).json({ message: 'Slide not found' });

    const key = slide.imageUrl.split('.amazonaws.com/')[1];


    await deleteFileFromS3(key);

    await Slide.findByIdAndDelete(id);

    res.json({ message: 'Slide deleted successfully' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ message: 'Failed to delete slide' });
  }
};
