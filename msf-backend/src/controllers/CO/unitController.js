import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import { getSignedFileUrl } from '../../config/awsS3Helper.js';


export const getUnits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const units = await Unit.find()
      .sort({ rank: 1 })
      .skip(skip)
      .limit(limit)
      .select('name rank grade totalScore classification');
    const totalUnits = await Unit.countDocuments();
    const totalPages = Math.ceil(totalUnits / limit);

    if (!units.length && page === 1) {
      return res.status(404).json({ message: 'No units found' });
    }

    res.status(200).json({
      units,
      currentPage: page,
      totalPages,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnitDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid unit ID" });
  }

  try {
    const unit = await Unit.findById(id)
      .select("name grade rank totalScore programs")
      .lean();

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // ✅ attach signed urls for program images
    if (unit.programs?.length > 0) {
      unit.programs = await Promise.all(
        unit.programs.map(async (p) => {
          const signedUrls = p.imageKeys?.length
            ? await Promise.all(p.imageKeys.map((k) => getSignedFileUrl(k)))
            : [];

          return {
            ...p,
            imageUrls: signedUrls,
          };
        })
      );
    }

    res.status(200).json(unit);
  } catch (error) {
    console.error("getUnitDetails error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUnitCommittee = async (req, res) => {
  const { id, type } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid unit ID" });
  }

  const committeePath = type === "msf" ? "msfCommittee" : "harithaCommittee";

  try {
    const unit = await Unit.findById(id)
      .select(committeePath)
      .populate(`${committeePath}.president`, "name gender profileImageKey")
      .populate(`${committeePath}.secretary`, "name gender profileImageKey")
      .populate(`${committeePath}.treasurer`, "name gender profileImageKey")
      .populate(`${committeePath}.vicePresidents`, "name gender profileImageKey")
      .populate(`${committeePath}.jointSecretaries`, "name gender profileImageKey")
      .lean();

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const committee = unit[committeePath];

    // helper
    const attachSignedUrl = async (user) => {
      if (!user) return user;
      return {
        ...user,
        profileImage: user.profileImageKey
          ? await getSignedFileUrl(user.profileImageKey)
          : null,
      };
    };

    // single
    committee.president = await attachSignedUrl(committee.president);
    committee.secretary = await attachSignedUrl(committee.secretary);
    committee.treasurer = await attachSignedUrl(committee.treasurer);

    // arrays
    committee.vicePresidents = await Promise.all(
      (committee.vicePresidents || []).map(attachSignedUrl)
    );

    committee.jointSecretaries = await Promise.all(
      (committee.jointSecretaries || []).map(attachSignedUrl)
    );

    res.status(200).json(committee);
  } catch (error) {
    console.error("getUnitCommittee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//=================Unit User===================

export const getUnitProfile = async (req, res) => {
  try {
    const unitId = req.user.id;

    const unit = await Unit.findById(unitId)
      .select("-password -adminDefaultPassword")
      .populate("msfCommittee.president", "name profileImageKey gender")
      .populate("msfCommittee.secretary", "name profileImageKey gender")
      .populate("msfCommittee.treasurer", "name profileImageKey gender")
      .populate("msfCommittee.vicePresidents", "name profileImageKey gender")
      .populate("msfCommittee.jointSecretaries", "name profileImageKey gender")
      .populate("harithaCommittee.president", "name profileImageKey gender")
      .populate("harithaCommittee.secretary", "name profileImageKey gender")
      .populate("harithaCommittee.treasurer", "name profileImageKey gender")
      .populate("harithaCommittee.vicePresidents", "name profileImageKey gender")
      .populate("harithaCommittee.jointSecretaries", "name profileImageKey gender")
      .lean();

    if (!unit) {
      return res.status(404).json({ message: "Unit profile not found." });
    }

    const attachSignedUrl = async (user) => {
      if (!user) return user;
      return {
        ...user,
        profileImage: user.profileImageKey
          ? await getSignedFileUrl(user.profileImageKey)
          : null,
      };
    };

    // committee single users
    unit.msfCommittee.president = await attachSignedUrl(unit.msfCommittee?.president);
    unit.msfCommittee.secretary = await attachSignedUrl(unit.msfCommittee?.secretary);
    unit.msfCommittee.treasurer = await attachSignedUrl(unit.msfCommittee?.treasurer);

    unit.harithaCommittee.president = await attachSignedUrl(unit.harithaCommittee?.president);
    unit.harithaCommittee.secretary = await attachSignedUrl(unit.harithaCommittee?.secretary);
    unit.harithaCommittee.treasurer = await attachSignedUrl(unit.harithaCommittee?.treasurer);

    // committee arrays
    unit.msfCommittee.vicePresidents = await Promise.all(
      (unit.msfCommittee?.vicePresidents || []).map(attachSignedUrl)
    );
    unit.msfCommittee.jointSecretaries = await Promise.all(
      (unit.msfCommittee?.jointSecretaries || []).map(attachSignedUrl)
    );

    unit.harithaCommittee.vicePresidents = await Promise.all(
      (unit.harithaCommittee?.vicePresidents || []).map(attachSignedUrl)
    );
    unit.harithaCommittee.jointSecretaries = await Promise.all(
      (unit.harithaCommittee?.jointSecretaries || []).map(attachSignedUrl)
    );

    // ✅ FIX: Programs signed urls
    if (unit.programs && unit.programs.length > 0) {
      unit.programs = await Promise.all(
        unit.programs.map(async (program) => {
          const signedUrls = await Promise.all(
            (program.imageKeys || []).map((key) => getSignedFileUrl(key))
          );

          return {
            ...program,
            imageUrls: signedUrls, // ✅ frontend should use this
          };
        })
      );

      unit.programs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.status(200).json(unit);
  } catch (error) {
    console.error("Error fetching unit profile:", error);
    res.status(500).json({
      message: "Server error fetching profile.",
      error: error.message,
    });
  }
};


export const updateUnitUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const existingUnit = await Unit.findOne({ username });
    if (existingUnit && existingUnit._id.toString() !== req.params.unitId) {
      return res.status(409).json({ message: "Username is already in use." });
    }

    const unit = await Unit.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.status(200).json({ message: "Unit username updated successfully.", unit });

  } catch (error) {
    handleError(res, error, "Failed to update unit username.");
  }
};

export const changeUnitPassword = async (req, res) => {
  try {
    const { oldPassword, password } = req.body;

    if (!oldPassword || !password) {
      return res.status(400).json({ message: "Old and new passwords are required." });
    }

    const unit = await Unit.findById(req.user.id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, unit.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    unit.password = hashedPassword;
    await unit.save();

    res.status(200).json({ message: "Password changed successfully." });

  } catch (error) {
    handleError(res, error, "Failed to change password.");
  }
};
