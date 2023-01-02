import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import GamePage from './GamePage';

export default {
  component: GamePage,
} as ComponentMeta<typeof GamePage>;

const Template: ComponentStory<typeof GamePage> = (args) => <GamePage {...args} />;

export const Primary = Template.bind({});
Primary.args = {

};
