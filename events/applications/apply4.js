
const client = require("../../index") 
const { Modal, TextInputComponent, MessageActionRow, MessageButton, MessageEmbed, Intents, InteractionType, MessageAttachment } = require("discord.js");

const db = require('quick.db');
const system = '4';


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === `edit_question${system}`) {

    const questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`);

    const buttons = questionOptions.map((_, index) =>
      new MessageButton()
        .setStyle('PRIMARY')
        .setLabel(index === 10 ? '11' : `${index + 1}`)
        .setCustomId(`${system}question_${index + 1}`)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new MessageActionRow().addComponents(buttons.slice(i, i + 5)));
    }
    interaction.reply({ components: rows, ephemeral: true });
  } else if (interaction.customId.startsWith(`${system}question_`)) {

    const questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`);
    if (!questionOptions || questionOptions.length === 0) {

      console.log('No question options available.');
      return;
    }

    const questionIndex = parseInt(interaction.customId.split('_')[1]) - 1;
    const currentQuestion = questionOptions[questionIndex];

    const adminQuestionEmbed = new MessageEmbed()
      .setTitle('Change Question')
      .setDescription(`Current Question: ${currentQuestion}`)
      .addField('New Question', 'Please enter the new question:')
      .setColor('#00ff00');

    interaction.reply({ embeds: [adminQuestionEmbed], ephemeral: true });

    const filter = (m) => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1 });
    const newQuestion = collected.first().content;

    questionOptions[questionIndex] = newQuestion;
    db.set(`application_questions_${interaction.guild.id}_${system}`, questionOptions);


    const confirmationEmbed = new MessageEmbed()
      .setTitle('Question Updated')
      .setDescription(`Question ${questionIndex + 1} has been updated successfully.`)
      .addField('New Question', newQuestion)
      .setColor('#00ff00');

    interaction.followUp({ embeds: [confirmationEmbed] });
  }
});



client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === `add_question${system}`) {
    const Embed = new MessageEmbed()
    .setTitle('Question Updated')
    .setDescription(`Please input the new question.`)
    await interaction.reply({ embeds: [Embed], ephemeral: true });

    const filter = (response) => response.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1 });
    const newQuestion = collected.first().content;


    const questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`) || [];
    questionOptions.push(newQuestion);
    db.set(`application_questions_${interaction.guild.id}_${system}`, questionOptions);
    const Embeds = new MessageEmbed()
    .setDescription(`The new question has been added successfully`)
    await interaction.followUp({ embeds: [Embeds], ephemeral: true });
  }

  if (interaction.customId === `remove_question${system}`) {

    const questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`) || [];


    const buttons = questionOptions.map((_, index) => 
      new MessageButton()
        .setStyle('PRIMARY')
        .setLabel(index === 10 ? '11' : `${index + 1}`)
        .setCustomId(`remove_question_${system}_${index + 1}`) 
    );


    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new MessageActionRow().addComponents(buttons.slice(i, i + 5)));
    }

    const Embed = new MessageEmbed()
    .setDescription(`Please select the question to remove`)
    await interaction.reply({ embeds: [Embed], components: rows, ephemeral: true });
  }
 else if (interaction.customId.startsWith(`remove_question_${system}_`)) {
  let questionOptions = db.get(`application_questions_${interaction.guild.id}_${system}`) || [];

    const selectedQuestionIndex = interaction.customId.split('_')[3]; 
    const selectedQuestion = questionOptions[selectedQuestionIndex - 1]; 


    const updatedQuestionOptions = questionOptions.filter(question => question !== selectedQuestion);
    db.set(`application_questions_${interaction.guild.id}_${system}`, updatedQuestionOptions);
    const Embed = new MessageEmbed()
    .setDescription(`The selected question has been removed successfully`)
    await interaction.reply({ embeds: [Embed], ephemeral: true });
  }
}
);





client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === `apply_button${system}`) {
    await interaction.reply({ content: 'Your application has been created successfully! Please check your DMs.', ephemeral: true });
    const user = interaction.user;
    const guildId = interaction.guild.id;
    const questionOptions = db.get(`application_questions_${guildId}_${system}`);
    const questions = questionOptions.map((option, index) => `${option}`);
    const answers = [];


    for (const [index, question] of questions.entries()) {
      const filter = (response) => response.author.id === user.id;
      const questionEmbed = new MessageEmbed()
        .setAuthor(interaction.guild.name, interaction.guild.iconURL({ format: 'png', dynamic: true }))
        .addFields(
          { name: `📜 Question \`[${index + 1}]\``, value: `\`\`\`${question}\`\`\``, inline: true }
        )
         .setThumbnail(interaction.guild.iconURL({ format: 'png', dynamic: true }))
         .setColor('#00ff00');

      await user.send({ embeds: [questionEmbed] });

      const collected = await user.dmChannel.awaitMessages({ filter, max: 1 });
      const answer = collected.first().content;
      answers.push(answer);
    }

    db.set(`application_answers_${user.id}`, answers);
    const Embed = new MessageEmbed()
    .setDescription(`✅ Your application has been created successfully!`)
    await user.send({embeds: [Embed]});

    const applicationLogsChannelId = db.get(`application_logs_channel_${guildId}_${system}`);
    if (!applicationLogsChannelId) return;

    const applicationLogsChannel = interaction.guild.channels.cache.get(applicationLogsChannelId);
    if (!applicationLogsChannel) return;

    const logEmbed = new MessageEmbed()
      .setTitle('New Application')
      .setDescription('A new application has been submitted')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `<@${user.id}>`, inline: true },
         { name: 'Application System', value: `${system}`, inline: true },
        { name: 'Application Data', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setColor('#00ff00');

    for (const [index, question] of questions.entries()) {
      logEmbed.addFields(
        { name: `Question \`[${index + 1}]\` ${question}`, value: `\`\`\`${answers[index]}\`\`\`` }
      );
    }

    const acceptButton = new MessageButton()
      .setCustomId(`accept_button${system}`)
      .setLabel('Accept')
      .setEmoji('✔')
      .setStyle('SUCCESS');

    const rejectButton = new MessageButton()
      .setCustomId(`reject_button${system}`)
      .setEmoji('✖')
      .setLabel('Reject')
      .setStyle('DANGER');

    const buttonRow = new MessageActionRow()
      .addComponents(acceptButton, rejectButton);

    const logMessage = await applicationLogsChannel.send({ embeds: [logEmbed], components: [buttonRow] });

    const applicationData = {
      userId: user.id,
      message: logMessage.id,
    };

    db.set(`application_data_${logMessage.id}`, applicationData);
  }
});



client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === `accept_button${system}` || interaction.customId === `reject_button${system}`) {
      const applicationData = db.get(`application_data_${interaction.message.id}`);
      const user = await client.users.fetch(applicationData.userId);
      const message = await interaction.channel.messages.fetch(applicationData.message);
      const adminName = interaction.user.id;

      let statusEmoji, statusColor, statusDescription;
      if (interaction.customId === `accept_button${system}`) {
        statusEmoji = '✅';
        statusColor = '#00ff00';
        statusDescription = `Your application has been accepted! by <@${adminName}>`;
      } else if (interaction.customId === `reject_button${system}`) {
        statusEmoji = '❌';
        statusColor = '#ff0000';
        statusDescription = `Your application has been rejected! by <@${adminName}>`;
      }
      const logEmbed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ format: 'png', dynamic: true }))
      .setTitle('Application')
      .setDescription(`${statusEmoji} ${statusDescription}`)
      .setColor(statusColor)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `<@${user.id}>`, inline: true },
         { name: 'Application System', value: `${system}`, inline: true },
        { name: 'Application Data', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      );

    const questions = db.get(`application_questions_${interaction.guild.id}_${system}`);
    if (questions && questions.length > 0) {
      for (const [index, question] of questions.entries()) {
        const answer = db.get(`application_answers_${user.id}`)?.[index] || 'Not answered';
        logEmbed.addFields({ name: `Question [${index + 1}] ${question}`, value: `\`\`\`Answer: ${answer}\`\`\`` });
      }
    }

      const acceptButton = interaction.message.components[0].components.find(button => button.customId === `accept_button${system}`);
      const rejectButton = interaction.message.components[0].components.find(button => button.customId === `reject_button${system}`);
      acceptButton.setDisabled(true);
      rejectButton.setDisabled(true);
      const logEmbeds = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ format: 'png', dynamic: true }))
      .setDescription(`${statusEmoji} ${statusDescription}`)
      .setColor(statusColor)
      .setTimestamp()


      const ergerd = new MessageButton()
     .setCustomId('ert')
      .setLabel(`Sent from: ${interaction.guild.name}`)
      .setDisabled(true)
      .setStyle('SECONDARY');

    const ggds = new MessageActionRow()
      .addComponents(ergerd);

    logEmbed.setDescription(`${statusEmoji} ${statusDescription}`);
    await interaction.update({ embeds: [logEmbed], components: [interaction.message.components[0]] });
      await user.send({embeds: [logEmbeds], components: [ggds]});

    }
  }
});