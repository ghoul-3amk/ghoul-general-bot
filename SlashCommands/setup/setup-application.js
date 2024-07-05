const { Client, MessageEmbed, CommandInteraction, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const db = require('quick.db');


module.exports = {
  name: "setup-application",
  description: "Set up the application system",
  category: 'setup',
  options: [
    {
      name: 'system',
      description: 'Select the application system',
      type: 'STRING',
      required: true,
      choices: [
        {
          name: '1 application system',
          value: '1'
        },
        {
          name: '2 application system',
          value: '2'
        },
        {
          name: '3 application system',
          value: '3'
        },
        {
          name: '4 application system',
          value: '4'
        },
        {
          name: '5 application system',
          value: '5'
        }
      ]
    },
    {
      name: 'channel',
      description: "Channel to send the application questions",
      type: 'CHANNEL',
      required: true
    },
    {
      name: 'applicationlogschannel',
      description: "Channel to send the application logs",
      type: 'CHANNEL',
      required: true
    },
    {
      name: 'question-options',
      description: 'Add / to separate the question options Example: what is your real name / How old are you',
      type: 3,
      required: true,
    },
    {
      name: "button_label",
      description: "Label for the application button",
      type: "STRING",
      required: false,
    },
    {
      name: "button_emoji",
      description: "Emoji for the application button",
      type: "STRING",
      required: false,
    },
    {
      name: 'button_color',
      description: 'Color of the application buttons',
      type: 'STRING',
      required: false,
      choices: [
          { name: 'Red', value: 'DANGER' },
          { name: 'Green', value: 'SUCCESS' },
          { name: 'Blurple', value: 'PRIMARY' },
          { name: 'Grey', value: 'SECONDARY' },
      ],
    },
    {
      name: "embed_description",
      description: "Label for the button",
      type: "STRING",
      required: false,
    },
  ],
  run: async (client, interaction, args) => {
    const channel = interaction.options.getChannel('channel');
    const applicationLogsChannel = interaction.options.getChannel('applicationlogschannel');
    const questionOptions = interaction.options.getString('question-options').split('/').map(option => option.trim());
    const system = interaction.options.getString('system');
    let label = interaction.options.getString('button_label') || `Apply`;
    let Description = interaction.options.getString('embed_description') || `Click the "Apply" button to apply`;
    let emojisbutton = interaction.options.getString('button_emoji') || `<:zfrzegerh:1153541488530182185>`;
    const questions = questionOptions.map((option, index) => `Question ${index + 1}: ${option}`);
    const bcolor = interaction.options.getString('button_color') || 'SECONDARY'


    // Store the question options in the database
    db.set(`application_questions_${interaction.guild.id}_${system}`, questionOptions);
    db.set(`application_logs_channel_${interaction.guild.id}_${system}`, applicationLogsChannel.id);

    // Send the setup confirmation message
    const embed = new MessageEmbed()
      .setTitle('Application System Setup')
      .setDescription('Application system has been set up successfully!')
      .addField('Channel', channel.toString())
      .addField('Application Logs Channel', applicationLogsChannel.toString())
      .addField('📜 Questions', questions.join('\n'))
      .addField('⚙ System', system)
      .setColor('#00ff00');

    const embeds = new MessageEmbed()
     .setAuthor(`${interaction.guild.name} Application`, interaction.guild.iconURL({ format: 'png', dynamic: true }))
     .setThumbnail(interaction.guild.iconURL({ format: 'png', dynamic: true }))
      .setDescription(Description)
      .setColor('#00ff00');

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle(bcolor)
        .setLabel(label)
        .setEmoji(emojisbutton)
        .setCustomId(`apply_button${system}`)
    );

    const row1 = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle('SECONDARY')
        .setLabel('Edit Question')
        .setEmoji('1174375434704654396')
        .setCustomId(`edit_question${system}`),
        new MessageButton()
        .setStyle('SUCCESS')
        .setEmoji('➕')
        .setLabel('Add Question')
        .setCustomId(`add_question${system}`),
      new MessageButton()
        .setStyle('DANGER')
        .setLabel('Delete Question')
        .setEmoji('🗑️')
        .setCustomId(`remove_question${system}`)
    );
    
    channel.send({ embeds: [embeds], components: [row] });
    interaction.followUp({ embeds: [embed], components: [row1] });

    setTimeout(() => {
      row1.components.forEach(button => button.setDisabled(true));

      interaction.editReply({ components: [row1] });
  }, 180000);

  },
};