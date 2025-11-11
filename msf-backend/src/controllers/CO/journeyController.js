import PanchayathJourney from '../../models/PanchayathJourney.js';

import { uploadFileToS3 ,deleteFileFromS3 } from '../../config/awsS3Helper.js';

 
export const getJourney = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const journeys = await PanchayathJourney.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const totalJourneys = await PanchayathJourney.countDocuments();
        const totalPages = Math.ceil(totalJourneys / limit);

        if (!journeys.length && page === 1) {
            return res.status(404).json({ message: "No journey found" });
        }

        res.json({
            journeys,
            currentPage: page,
            totalPages,
        });

    } catch (error) {
        console.log("Error fetching journey:", error);
        res.status(500).json({ message: 'Failed to fetch journey' });
    }
};


//=================admin Controller==========

export const getJourneys = async (req, res) => {
  try {
    const journey = await PanchayathJourney.find(); 
    if (!journey.length) {
      return res.status(404).json({ message: "No journey found" });
    }

    const simplifiedJourneys = journey.map((journeyItem) => {
      return {
        _id: journeyItem._id,
        title: journeyItem.title,
        description: journeyItem.description,
        date: journeyItem.date,
        images: journeyItem.images.length > 0 ? [journeyItem.images[0]] : [], // Only return the first image if available
      };
    });

    res.json(simplifiedJourneys);
  } catch (error) {
    console.log("Error fetching journey:", error);
    res.status(500).json({ message: 'Failed to fetch journey' });
  }
};

export const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid journey ID' });
    }

    const journey = await PanchayathJourney.findById(id); 
    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    res.json({
      title: journey.title,
      description: journey.description,
      date: journey.date,
      images: journey.images || [], 
    });
  } catch (error) {
    console.error("Error fetching journey:", error);
    res.status(500).json({ message: 'Failed to fetch journey' });
  }
};

export const addJourney = async (req, res) => {
  try {
    const { name, description, date } = req.body;
    const imageUrls = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const { url } = await uploadFileToS3('journeys/', file); 
      imageUrls.push(url); 
    }

    const newJourney = new PanchayathJourney({
      title: name,
      description,
      date,
      images: imageUrls,
    });

    await newJourney.save();
    res.status(201).json({ message: 'Journey added successfully' });
  } catch (error) {
    console.error("Error adding journey:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;

    const journey = await PanchayathJourney.findById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    for (const imageUrl of journey.images) {
      const imageKey = imageUrl.split('.amazonaws.com/').pop();
      await deleteFileFromS3(imageKey);
    }

    await PanchayathJourney.findByIdAndDelete(id);

    res.status(200).json({ message: 'Journey and images deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete journey and images' });
  }
};

