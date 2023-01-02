import React from 'react';
import PlayerCard from "./PlayerCard";
import {ComponentMeta, ComponentStory} from "@storybook/react";
import {PLAYER_COLORS} from "../../helpers/playerColors";

export default {
    component: PlayerCard,
    argTypes: { playerColor: { control: 'select', options: PLAYER_COLORS, defaultValue: PLAYER_COLORS[0] } }
} as ComponentMeta<typeof PlayerCard>;

const Template: ComponentStory<typeof PlayerCard> = (args) => <PlayerCard {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    avatar: "https://i.pravatar.cc/300",
    playerName: "Myroslav Kuzmenko",
    rank: 1,
    energy: 100,
    robotsLeft: 10,
    maxRobots: 100,
}

export const LongName = Template.bind({});
LongName.args = {
    avatar: "https://i.pravatar.cc/300",
    playerName: "Alexander Kuzmenko is a very long name that will be truncated in the player card component because it is too long",
    rank: 1,
    energy: 100,
    robotsLeft: 10,
    maxRobots: 100,
}
