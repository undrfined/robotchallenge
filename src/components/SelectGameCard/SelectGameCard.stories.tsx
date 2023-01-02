import React from 'react';
import SelectGameCard from "./SelectGameCard";
import {ComponentMeta, ComponentStory} from "@storybook/react";
import RobotIcon from '../../assets/lottie/Robot.json';
import LightningIcon from '../../assets/lottie/Lightning.json';

export default {
    component: SelectGameCard,
} as ComponentMeta<typeof SelectGameCard>;

const Template: ComponentStory<typeof SelectGameCard> = (args) => <SelectGameCard {...args} />;

export const Robot = Template.bind({});
Robot.args = {
    title: "Robot Challenge",
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    maxPoints: 100,
    icon: RobotIcon,
}

export const Blitz = Template.bind({});
Blitz.args = {
    title: "Blitz",
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    maxPoints: 100,
    icon: LightningIcon,
}
