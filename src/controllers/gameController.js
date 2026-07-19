import { prisma } from "../config/db.js";
import { compressImage } from "../utils/compressImage.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// User adds 3 cards:
const createGame = async (req, res) => {
  try {
    const user = req.user;

    const { title, description, category, tags, pairs } = req.body;

    const parsedTags = JSON.parse(tags || "[]");
    const parsedPairs = JSON.parse(pairs || "[]");

    if (!title || !description || !parsedPairs) {
      return res.status(400).json({
        status: "error",
        message: "Title, Decription and Game pairs is required",
      });
    }

    const existingGame = await prisma.game.findUnique({
      where: { title: title },
    });

    if (existingGame) {
      return res.status(400).json({
        status: "error",
        message: "A game with that Title already exist",
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

    let gameImageUrl = null;

    const gameImageFile = getFile("image");

    if (gameImageFile) {
      const compressed = await compressImage(gameImageFile.buffer);
      const result = await uploadToCloudinary(compressed);

      gameImageUrl = result.secure_url;
    }

    const game = await prisma.game.create({
      data: {
        title,
        description,
        image: gameImageUrl,
        category,
        tags: parsedTags,
        createdBy: user.id,
        pairs: {
          create: await Promise.all(
            parsedPairs.map(async (pair, index) => {
              const leftImageFile = getFile(`pairs[${index}][leftImage]`);
              const rightImageFile = getFile(`pairs[${index}][rightImage]`);

              let leftImageUrl = null;
              let rightImageUrl = null;

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
          ),
        },
      },
      include: {
        pairs: true,
      },
    });

    return res.status(201).json({
      status: "success",
      data: game,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a game like this.
// {
//   "title": "Soda Battle",
//   "description": "Updated description",
//   "pairs": [
//     {
//       "id": "pair1",
//       "leftScore": 5
//     },
//     {
//       "id": "pair2",
//       "rightName": "Pepsi Max"
//     }
//   ]
// }
// IMAGE IS CURRENTLY NOT INCLUDED
const updateGame = async (req, res) => {
  try {
    const gameId = req.params.id;

    const { title, description, pairs } = req.body;

    if (!title && !description && !pairs) {
      return res.status(400).json({
        error: "At least one field is required to update",
      });
    }

    // Updating the game
    if (title !== undefined || description !== undefined) {
      await prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          title,
          description,
        },
      });
    }

    // Updating the games pairs
    // In same cases we might not update everything, but it still works because
    if (pairs?.length > 0) {
      // Could use a normal loop here instead of transaction but this is faster and rolls it all back if one doesnt update.
      await prisma.$transaction(
        pairs.map((pair) =>
          prisma.pair.update({
            where: { id: pair.id },
            data: clean({
              leftName: pair.leftName,
              leftImage: pair.leftImage,
              leftScore: pair.leftScore,
              rightName: pair.rightName,
              rightImage: pair.rightImage,
              rightScore: pair.rightScore,
            }),
          }),
        ),
      );
    }

    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: { pairs: true },
    });

    return res.status(200).json({
      status: "success",
      data: updatedGame,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const deleteGame = async (req, res) => {
  try {
    const user = req.user;
    const gameId = req.params.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    // Check if the user that is trying to delete is the actual owner of the game.
    if (game.createdBy !== user.id) {
      return res.status(400).json({
        status: "Author error",
        message: "Only the author or admin can delete the game",
      });
    }

    // Delete the game
    await prisma.game.delete({
      where: {
        id: gameId,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Game deleted",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getGames = async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      data: games,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getHomeGames = async (req, res) => {
  try {
    const [topGames, newGames, categories] = await Promise.all([
      prisma.game.findMany({
        take: 10,
        orderBy: {
          plays: "desc",
        },
      }),

      prisma.game.findMany({
        take: 12,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.game.groupBy({
        by: ["category"],
        orderBy: {
          category: "asc",
        },
      }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        topGames,
        newGames,
        categories: categories.map((c) => c.category),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getGame = async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    return res.status(200).json({
      status: "success",
      data: game,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Here i will get the full game with id, including pairs
const getFullGame = async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        pairs: true,
      },
    });

    return res.status(200).json({
      status: "success",
      data: game,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const updatePairScore = async (req, res) => {
  const { pairId, name, side } = req.body;

  try {
    const pair = await prisma.pair.findUnique({
      where: {
        id: pairId,
      },
    });

    if (!pair) {
      return res.status(400).json({
        status: "Error",
        message: "Pair not found",
      });
    }

    // what we will update
    const data =
      side === "left"
        ? { leftScore: { increment: 1 } }
        : { rightScore: { increment: 1 } };

    const updatedPair = await prisma.pair.update({
      where: {
        id: pairId,
      },
      data,
    });

    return res.status(200).json({
      status: "success",
      data: updatedPair,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const updatePlayScore = async (req, res) => {
  const gameId = req.params.id;
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({
        status: "error",
        message: "Could not find a game with that id",
      });
    }

    const updatedGame = await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        plays: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Successfully updated play score",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export {
  createGame,
  updateGame,
  deleteGame,
  getGame,
  getFullGame,
  getGames,
  getHomeGames,
  updatePairScore,
  updatePlayScore,
};
