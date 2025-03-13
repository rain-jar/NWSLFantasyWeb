/** @jsxImportSource @emotion/react */
import { useState } from "react";
import { css } from "@emotion/react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

const PlayerDetailsModal = ({ open, onClose, player }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <Modal open={open} onClose={onClose} css={modalBackdrop}>
      <Box css={modalStyle}>
        {/* Top Row: Player Info */}
        <div css={topRow}>
          <div css={playerInfo}>
            <h2>{player.name}</h2>
            <p css={teamName}>{player.team}</p>
            <p css={teamName}>{player.position}</p>
          </div>
          <img src={player.image_url || process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} css={playerImage} />
        </div>

        {/* Tabs Row */}
        <div css={tabsContainer}>
          {["Overview", "Game Log", "Stats"].map((tab) => (
            <div
              key={tab}
              css={[tabStyle, activeTab === tab && activeTabStyle]}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div css={contentArea}>
          {activeTab === "Overview" && (
            <>
                <p>{player.description}</p>
                <p>Fantasy Points : {player.FantasyPoints}</p>
            </>
          )}
          {activeTab === "Game Log" && <p>Nothing yet</p>}
          {activeTab === "Stats" && <p>Nothing yet</p>}
        </div>
      </Box>
    </Modal>
  );
};

export default PlayerDetailsModal;


const modalBackdrop = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const modalStyle = css`
  background: white;
  width: 90%;
  max-width: 450px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);
  outline: none;
  text-align: center;
`;

/* Top Row: Player Info */
const topRow = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const playerInfo = css`
  text-align: left;
`;

const teamName = css`
  font-size: 14px;
  color: #777;
  margin-top: -6px;
`;

const playerImage = css`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;

/* Tabs Row */
const tabsContainer = css`
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const tabStyle = css`
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  position: relative;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #222;
  }
`;

const activeTabStyle = css`
  color: black;
  font-weight: bold;

  &:after {
    content: "";
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 2px;
    background: black;
    border-radius: 2px;
  }
`;

/* Content Area */
const contentArea = css`
  padding: 16px;
  min-height: 100px;
  font-size: 14px;
  color: #444;
  text-align: left;
`;
