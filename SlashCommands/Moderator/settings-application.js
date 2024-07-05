const { Client, MessageEmbed, CommandInteraction, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const db = require('quick.db');
module.exports = {
  name: "setting-application",
  description: "View or change settings for the application system",
  category: 'setup',
  options: [
    {
      name: 'system',
      description: 'Select the application system',
      type: 3, 
      required: true,
      choices: [
        { name: '1 application system', value: '1' },
        { name: '2 application system', value: '2' },
        { name: '3 application system', value: '3' },
        { name: '4 application system', value: '4' },
        { name: '5 application system', value: '5' }
      ]
    }
  ],
  run: async (client, interaction) => {
    const system = interaction.options.getString('system');
    const questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`);
    const logsChannelId = db.get(`application_logs_channel_${interaction.guild.id}_${system}`);

    if (!questionOptions || !logsChannelId) {
        const errorMessage = new MessageEmbed()
        .setDescription(`No settings found for application system ${system}`);
      return interaction.followUp({ embeds: [errorMessage]});
    }
    const questions = questionOptions.map((option, index) => `Question ${index + 1}: ${option}`);

    const embed = new MessageEmbed()
    .setAuthor(`${interaction.guild.name}`, interaction.guild.iconURL({ format: 'png', dynamic: true }))

      .setTitle(`> ✅ Application System settings \`${system}\``)
      .addField('> 🔗 Application Logs Channel',`<#${logsChannelId}>`)
      .addField('📜 Questions', questions.join('\n'))
      .setFooter(`${interaction.guild.name}`, interaction.guild.iconURL({ format: 'png', dynamic: true }))
      .setColor('RANDOM');

      const row1 = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel('Edit Question')
          .setEmoji('⚙')
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

   interaction.followUp({ embeds: [embed], components: [row1], ephemeral: true });

  setTimeout(() => {
    row1.components.forEach(button => button.setDisabled(true));

    interaction.editReply({ components: [row1] });
}, 180000);

},
};