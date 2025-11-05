import PanchayathJourney from '../../models/PanchayathJourney.js';

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