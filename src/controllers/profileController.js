import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { compressImage } from "../utils/compressImage.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const updateUserInfo = async (req, res) => {
  try {
    // User info
    const userId = req.user.id;
    const { username, password } = req.body;

    const data = {};

    if (username !== undefined) {
      data.username = username;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    // Set the updated user data on the frontend so we show for exampel the new username.
    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to update user." });
  }
};

const getMyGames = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch games that the user has created.
    const myGames = await prisma.game.findMany({
      where: {
        createdBy: userId,
      },
      orderBy: {
        title: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      data: myGames,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Could not fetch my games." });
  }
};

// FINISH THIS!!
const updateMyGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.id;

    // IMPORTANT: Always send all the games information to this function, or it breaks.
    const { title, description, category, tags, pairs } = req.body;

    const parsedTags = JSON.parse(tags || "[]");
    const parsedPairs = JSON.parse(pairs || "[]");

    // Check ownership
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        createdBy: userId,
      },
    });

    if (!game) {
      return res.status(404).json({
        status: "error",
        message: "Game not found or unauthorized",
      });
    }

    if (!Array.isArray(parsedPairs) || parsedPairs.length < 3) {
      return res.status(400).json({
        status: "error",
        message: "You must provide atleast 3 pairs",
      });
    }

    const getFile = (fieldname) =>
      req.files.find((f) => f.fieldname === fieldname);

    // Handle main game image
    let gameImageUrl = game.image;

    const gameImageFile = getFile("image");

    if (gameImageFile) {
      const compressed = await compressImage(gameImageFile.buffer);
      const result = await uploadToCloudinary(compressed);

      gameImageUrl = result.secure_url;
    }

    // Handle pairs
    const updatedPairs = await Promise.all(
      parsedPairs.map(async (pair, index) => {
        let leftImageUrl = pair.leftImage || null;
        let rightImageUrl = pair.rightImage || null;

        const leftImageFile = getFile(`pairs[${index}][leftImage]`);

        const rightImageFile = getFile(`pairs[${index}][rightImage]`);

        if (leftImageFile) {
          const compressed = await compressImage(leftImageFile.buffer);
          const result = await uploadToCloudinary(compressed);

          leftImageUrl = result.secure_url;
        }

        if (rightImageFile) {
          const compressed = await compressImage(rightImageFile.buffer);
          const result = await uploadToCloudinary(compressed);

          rightImageUrl = result.secure_url;
        }

        return {
          leftName: pair.leftName,
          rightName: pair.rightName,
          leftImage: leftImageUrl,
          rightImage: rightImageUrl,
        };
      }),
    );

    const updatedGame = await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        title,
        description,
        image: gameImageUrl,
        category,
        tags: parsedTags,

        pairs: {
          deleteMany: {},
          create: updatedPairs,
        },
      },
      include: {
        pairs: true,
      },
    });

    // TODO: Delete images on cloudinary here that we arent using anymore.

    return res.status(200).json({
      status: "success",
      data: updatedGame,
      message: "Updated game.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Could not update game.",
    });
  }
};

const deleteMyGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.id;

    // Delete specific game with gameId
    // IMPORTANT: Make sure that only the user or someone with ADMIN role can delete the game.

    // Checking for ownership
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        createdBy: userId,
      },
    });

    if (!game) {
      return res
        .status(404)
        .json({ status: "error", message: "Game not found or unauthorized" });
    }

    // Delete the game
    const deletedGame = await prisma.game.delete({
      where: {
        id: gameId,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Deleted game.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", message: "Could not delete game." });
  }
};

export { updateUserInfo, getMyGames, updateMyGame, deleteMyGame };
