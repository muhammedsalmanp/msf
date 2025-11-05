import unitUsers from "../../models/unitUsers.js";


export const getCommitteeUsersByUnit = async (req, res) => {

    try {
        
        console.log("testring the erroroor ",req.params,req.user);
        
        const { committeeType } = req.params;
        const unitId = req.user.id;

        console.log("Unit:", unitId, "Committee:", committeeType);

        if (!unitId || !committeeType) {
            return res.status(400).json({ message: "Missing unit ID or committee type." });
        }

        const scopeToMatch = committeeType.toLowerCase();

        if (scopeToMatch !== "msf" && scopeToMatch !== "haritha") {
            return res.status(400).json({ message: `Invalid committee type: ${committeeType}` });
        }

        const query = {
            unit: unitId,
            roles: { $elemMatch: { scope: scopeToMatch } },
        };

        const users = await unitUsers.find(query)
            .select("name gender profileImage roles")
            .populate("roles.role", "title")
            .lean();

        const filteredUsers = users.map(user => {
            return {
                ...user,
                roles: user.roles.filter(roleEntry => roleEntry.scope === scopeToMatch)
            };
        });

        return res.status(200).json(filteredUsers);

    } catch (error) {

        console.error("Error fetching committee users:", error);

        res.status(500).json({ message: "Server error fetching users." });

    }
};