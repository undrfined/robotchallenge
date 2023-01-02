import React from 'react';
import GamePage from "./GamePage";
import {ComponentMeta, ComponentStory} from "@storybook/react";

export default {
    component: GamePage,
} as ComponentMeta<typeof GamePage>;

const Template: ComponentStory<typeof GamePage> = (args) => <GamePage {...args} />;

export const Primary = Template.bind({});
Primary.args = {

}
