import PanchayathJourney from '../../models/PanchayathJourney.js';

import { uploadFileToS3 ,deleteFileFromS3,getSignedFileUrl} from '../../config/awsS3Helper.js';

 
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

    const journeysWithSignedUrls = await Promise.all(
      journeys.map(async (j) => {
        const signedImages = await Promise.all(
          (j.images || []).map(async (img) => {
            if (!img) return null;

            // if already url
            if (img.startsWith("http")) return img;

            // if key
            return await getSignedFileUrl(img);
          })
        );

        return {
          ...j.toObject(),
          images: signedImages.filter(Boolean),
        };
      })
    );

    res.json({
      journeys: journeysWithSignedUrls,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log("Error fetching journey:", error);
    res.status(500).json({ message: "Failed to fetch journey" });
  }
};

//=================admin Controller==========

export const getJourneys = async (req, res) => {
  try {
    const journeys = await PanchayathJourney.find().sort({ date: -1 });

    if (!journeys.length) {
      return res.status(404).json({ message: "No journey found" });
    }

    const simplifiedJourneys = await Promise.all(
      journeys.map(async (journeyItem) => {
        // journeyItem.images currently stores URL OR KEY
        const firstImageValue = journeyItem.images?.[0];

        let firstImage = null;

        // If stored as KEY: "journeys/abc.jpg" → make signed url
        if (firstImageValue && !firstImageValue.startsWith("http")) {
          firstImage = await getSignedFileUrl(firstImageValue);
        }

        // If stored as URL: "https://bucket....amazonaws.com/..." → use directly
        if (firstImageValue && firstImageValue.startsWith("http")) {
          firstImage = firstImageValue;
        }

        return {
          _id: journeyItem._id,
          title: journeyItem.title,
          description: journeyItem.description,
          date: journeyItem.date,
          images: firstImage ? [firstImage] : [],
        };
      })
    );

    res.json(simplifiedJourneys);
  } catch (error) {
    console.log("Error fetching journey:", error);
    res.status(500).json({ message: "Failed to fetch journey" });
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

    const imageKeys = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const { key } = await uploadFileToS3("journeys/", file);
      imageKeys.push(key);
    }

    const newJourney = new PanchayathJourney({
      title: name,
      description,
      date,
      images:imageKeys, // ✅ store keys
    });

    await newJourney.save();

    res.status(201).json({ message: "Journey added successfully" });
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
      return res.status(404).json({ message: "Journey not found" });
    }

    for (const img of journey.images) {
      if (!img) continue;

      const key = img.startsWith("http")
        ? img.split(".amazonaws.com/").pop()
        : img;

      await deleteFileFromS3(key);
    }

    await PanchayathJourney.findByIdAndDelete(id);

    res.status(200).json({ message: "Journey and images deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete journey and images" });
  }
};

