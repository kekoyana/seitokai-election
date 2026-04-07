/**
 * English dialogue translations for conversation and battle lines.
 */
import type { Personality, HobbyPreference, Gender, PlayerAttitude, Stance } from '../types';
import type { TalkLineSet, PlayerLineSet, ChitchatLineSet } from '../data/conversationLines';

type TalkAffinityGroup = 'high' | 'mid' | 'low';
type MoodGroup = 'angry' | 'normal' | 'happy';
type TopicCategory = 'faction' | 'hobby';

// ============================
// NPC talk lines (personality x gender)
// ============================

export const EN_TALK_LINES_DATA: Record<Personality, Record<Gender, TalkLineSet>> = {
  passionate: {
    male: {
      greeting: {
        high: [
          'Hey, great to see you again! How ya been?',
          'Yo! I was hoping you\'d show up!',
          'Gotta say, talkin\' to you is always a good time!',
        ],
        mid: [
          'Yo! What\'s up?',
          'Oh hey, what\'s goin\' on?',
          'Sup! How\'s it going?',
        ],
        low: [
          '...What do you want?',
          'Ugh... you again.',
          'Make it quick, will ya?',
        ],
      },
      hobbyReaction: {
        like: [
          'No way! I\'m into that too!',
          'Oh man, you get it! That stuff\'s awesome!',
          'Dude, don\'t get me started on that -- I\'ll talk your ear off!',
        ],
        dislike: [
          'Eh, that\'s not really my thing...',
          'Ah... I\'m not great with that kinda stuff.',
          'That one doesn\'t really click for me, honestly.',
        ],
        neutral: [
          'Hm, not bad I guess.',
          'Yeah, I can see the appeal.',
          'I mean, I don\'t hate it.',
        ],
      },
      farewell: {
        high: ['Let\'s do this again!', 'Later, man! That was fun!'],
        mid: ['Alright, catch ya later.', 'See ya around.'],
        low: ['...Later.', 'I\'m outta here.'],
      },
    },
    female: {
      greeting: {
        high: [
          'Oh hey, there you are! How\'s it going?',
          'Yooo! I\'ve been waiting for you!',
          'Talking with you is always so fun, y\'know!',
        ],
        mid: [
          'Hey! What\'s up?',
          'Hi there! Need something?',
          'Oh, how\'ve you been?',
        ],
        low: [
          '...What?',
          'Ugh... you\'re here again.',
          'If you\'ve got something to say, hurry up.',
        ],
      },
      hobbyReaction: {
        like: [
          'Wait, seriously?! I love that too!',
          'Right?! It\'s the best!',
          'Oh my gosh, I could talk about that forever!',
        ],
        dislike: [
          'Hmm, that\'s not really my jam...',
          'Ah... I\'m not great with that kinda thing.',
          'That one doesn\'t really click for me.',
        ],
        neutral: [
          'Hm, not bad I guess.',
          'Yeah, I can see the appeal.',
          'I mean, I don\'t hate it.',
        ],
      },
      farewell: {
        high: ['Let\'s chat again soon!', 'See ya! That was a blast!'],
        mid: ['Anyway, catch ya later!', 'Well, see ya!'],
        low: ['...Bye.', 'I gotta go.'],
      },
    },
  },

  cautious: {
    male: {
      greeting: {
        high: [
          'Oh, hello. I\'m glad we get to talk again.',
          'You came. Could I have a moment of your time?',
          'I actually look forward to our conversations, you know.',
        ],
        mid: [
          'Hello. Can I help you with something?',
          'Oh, hi. Is something on your mind?',
          'Did you want to talk? ...Sure, that\'s fine.',
        ],
        low: [
          '...Can I help you?',
          'Um, I\'m a bit busy right now...',
          'You\'re here again...',
        ],
      },
      hobbyReaction: {
        like: [
          'Actually, I\'m quite fond of that myself.',
          'Oh, that\'s... nice, isn\'t it? I\'ve been interested in it too.',
          'I understand. There\'s something satisfying about taking your time with it.',
        ],
        dislike: [
          'Oh, that\'s... not really my forte, I\'m afraid.',
          'Hmm, I\'m not particularly good with that, honestly...',
          'I\'m sorry, that area isn\'t really my thing...',
        ],
        neutral: [
          'I see... I can\'t say I know much about it.',
          'Hmm, I suppose it\'s alright.',
          'I don\'t dislike it, but I wouldn\'t say I\'m a fan either.',
        ],
      },
      farewell: {
        high: ['Let\'s talk again sometime.', 'I\'m glad we had this chat.'],
        mid: ['Well then, until next time.', 'I should be going.'],
        low: ['...If you\'ll excuse me.', 'Well then, goodbye.'],
      },
    },
    female: {
      greeting: {
        high: [
          'Oh, hello. I\'m happy we get to talk again.',
          'You came. Do you have a moment?',
          'I actually look forward to talking with you.',
        ],
        mid: [
          'Hello. Is there something I can help with?',
          'Oh, hi. Is something on your mind?',
          'Did you want to talk? ...Sure, that\'s fine.',
        ],
        low: [
          '...Can I help you?',
          'Um, I\'m a little busy right now...',
          'You\'re here again...',
        ],
      },
      hobbyReaction: {
        like: [
          'Actually, I\'m quite fond of that myself.',
          'Oh, that\'s... lovely, isn\'t it? I\'ve been interested too.',
          'I understand. There\'s something nice about taking your time with it.',
        ],
        dislike: [
          'Oh, that\'s... not really my forte, I\'m afraid.',
          'Hmm, I\'m not particularly good with that...',
          'I\'m sorry, that area isn\'t really my thing...',
        ],
        neutral: [
          'I see... I can\'t say I know much about it.',
          'Hmm, I suppose it\'s alright.',
          'I don\'t dislike it, but it\'s not something I\'m particularly into.',
        ],
      },
      farewell: {
        high: ['Let\'s talk again soon.', 'I\'m glad we had this chat.'],
        mid: ['Well then, until next time.', 'I should be going.'],
        low: ['...If you\'ll excuse me.', 'Well then, goodbye.'],
      },
    },
  },

  stubborn: {
    male: {
      greeting: {
        high: ['...You came. I was waiting.', 'Ah, it\'s you. ...Not bad.', '...Let\'s talk.'],
        mid: ['...What do you want?', 'Yeah.', '...Got something to say?'],
        low: ['......', '...Leave if you have no business here.', 'I have nothing to say.'],
      },
      hobbyReaction: {
        like: ['...Not bad. I thought the same.', 'Yeah, I\'ll give you that.', '...You have good taste.'],
        dislike: ['...Not interested.', 'Pointless.', '...Drop that subject.'],
        neutral: ['...Don\'t care.', 'Hmph. I see.', '...Suit yourself.'],
      },
      farewell: {
        high: ['...Come again.', '...That wasn\'t bad.'],
        mid: ['...We\'re done here.', 'Conversation\'s over.'],
        low: ['...', 'Leave.'],
      },
    },
    female: {
      greeting: {
        high: ['...You came. I was waiting.', 'It\'s you. ...Not bad.', '...Shall we talk?'],
        mid: ['...What do you want?', 'Yes?', '...Do you have something to say?'],
        low: ['......', '...Leave if you have no business.', 'I don\'t feel like talking.'],
      },
      hobbyReaction: {
        like: ['...Not bad. I thought so too.', 'Yes, I\'ll acknowledge that.', '...You do have taste.'],
        dislike: ['...Not interested.', 'How dull.', '...Change the subject.'],
        neutral: ['...I don\'t particularly care.', 'Hmph. I see.', '...Do as you like.'],
      },
      farewell: {
        high: ['...Come again.', '...That wasn\'t bad.'],
        mid: ['...We\'re done.', 'That\'s all.'],
        low: ['...', 'Go.'],
      },
    },
  },

  flexible: {
    male: {
      greeting: {
        high: [
          'Hey, you came! Awesome!',
          'Oh, we meet again! Listen, listen!',
          'Yooo! Let\'s have some fun today!',
        ],
        mid: [
          'Oh hey, what\'s up~',
          'Hi! Got any fun stories?',
          'Hey there~ long time no see... well, not really.',
        ],
        low: ['Oh, um... hey.', 'Uh... what\'s up?', 'Ah... yeah.'],
      },
      hobbyReaction: {
        like: [
          'Wait, that\'s so cool! I love it too!',
          'I know right! It\'s the best!',
          'Oh, I\'m totally into that! Let\'s talk about it!',
        ],
        dislike: [
          'Ah, sorry, that\'s not really my thing...',
          'Hmm, I\'m not really into that kind of stuff.',
          'Eh, I\'m kinda not great with that...',
        ],
        neutral: ['Hm, could be cool.', 'Oh really? Neat~', 'Yeah yeah, not bad.'],
      },
      farewell: {
        high: ['See ya! We gotta talk again for sure!', 'Bye bye! That was fun!'],
        mid: ['Well, see ya~', 'Take it easy~'],
        low: ['Oh, um... bye.', 'Well then...'],
      },
    },
    female: {
      greeting: {
        high: [
          'Oh, you\'re here! Yay!',
          'We meet again! Hey hey, listen listen!',
          'Hiii! Let\'s have fun today!',
        ],
        mid: [
          'Oh hey, what\'s up~',
          'Hi! Got any fun stories?',
          'Hey~ long time no see... well, not really.',
        ],
        low: ['Oh, um... hey.', 'Uh... what\'s up?', 'Ah... yeah.'],
      },
      hobbyReaction: {
        like: [
          'Wait, that\'s so cool! I love it too!',
          'I know right! It\'s the best!',
          'Oh, I\'m totally hooked on that too! Let\'s talk!',
        ],
        dislike: [
          'Ah, sorry, that\'s not really my thing...',
          'Hmm, I\'m not really into that kind of stuff.',
          'Eh, I\'m kinda not great with that...',
        ],
        neutral: ['Hm, could be cool.', 'Oh really? Neat~', 'Yeah yeah, not bad.'],
      },
      farewell: {
        high: ['See ya! We have to talk again!', 'Bye bye! That was so fun!'],
        mid: ['Well, see ya~', 'Take it easy~'],
        low: ['Oh, um... bye.', 'Well then...'],
      },
    },
  },

  cunning: {
    male: {
      greeting: {
        high: [
          'Oh, you came? ...I\'m pleased.',
          'Heh, time with you is always special.',
          'I\'ve been expecting you.',
        ],
        mid: [
          'Oh? Need something?',
          'Heh, what a surprise.',
          'Bored too? ...Just kidding.',
        ],
        low: ['...What is it?', 'Hm, still coming around, I see.', '...I don\'t have much time.'],
      },
      hobbyReaction: {
        like: [
          'Oh... I\'m actually into that myself. Surprised?',
          'Heh, you\'ve got good taste.',
          '...I\'ll give you that one. Not bad at all.',
        ],
        dislike: [
          'Oh, that\'s a bit... well.',
          'Hm... not really my cup of tea.',
          '...I\'ll pass on that.',
        ],
        neutral: ['Hm... I see.', 'Well, it\'s not bad.', '...Can\'t say I have strong feelings either way.'],
      },
      farewell: {
        high: ['I look forward to seeing you again.', 'Heh, until next time.'],
        mid: ['Well then, later.', 'See you.'],
        low: ['...Goodbye.', '......'],
      },
    },
    female: {
      greeting: {
        high: [
          'Oh my, you came? ...How lovely.',
          'Hehe, time with you is always special.',
          'I\'ve been waiting for you.',
        ],
        mid: [
          'Oh? Can I help you with something?',
          'Hehe, what a pleasant surprise.',
          'Bored too? ...Just teasing.',
        ],
        low: ['...What is it?', 'Hm, still coming around?', '...I don\'t have much time.'],
      },
      hobbyReaction: {
        like: [
          'Oh my... I\'m actually into that myself. Surprised?',
          'Hehe, you have wonderful taste.',
          '...I\'ll acknowledge that. Quite impressive.',
        ],
        dislike: [
          'Oh, that\'s a bit... well.',
          'Hm... not really to my taste.',
          '...I\'ll have to decline.',
        ],
        neutral: ['Hm... I see.', 'Well, it\'s not terrible.', '...Can\'t say I have strong feelings on that.'],
      },
      farewell: {
        high: ['I look forward to seeing you again.', 'Hehe, until next time.'],
        mid: ['Well then, later.', 'Farewell for now.'],
        low: ['...Goodbye.', '......'],
      },
    },
  },
};

// ============================
// Player lines (personality x gender)
// ============================

export const EN_PLAYER_LINES_DATA: Record<Personality, Record<Gender, PlayerLineSet>> = {
  passionate: {
    male: {
      greeting: ['Hey, got a sec?', 'Yo, let\'s talk for a bit!', 'Alright, let\'s go say hi!'],
      hobbyPrompt: ['So hey, you been into anything lately?', 'What do you do on your days off?', 'By the way, got any hobbies?'],
      farewell: ['Right, catch ya later!', 'Good talk! See ya!', 'Alright, let\'s do this again!'],
    },
    female: {
      greeting: ['Hey, got a sec?', 'Wanna chat for a bit?', 'Alright, let me go say hi!'],
      hobbyPrompt: ['So hey, you been into anything lately?', 'What do you do on your days off?', 'By the way, got any hobbies?'],
      farewell: ['See ya later!', 'Glad we talked! Bye!', 'Let\'s chat again!'],
    },
  },
  cautious: {
    male: {
      greeting: ['Excuse me, do you have a moment?', 'I was hoping we could talk a little...', 'Sorry to bother you, just a moment?'],
      hobbyPrompt: ['By the way, do you have any hobbies?', 'What do you usually do in your free time?', 'Have you been into anything lately?'],
      farewell: ['I\'m glad we could talk. Well then.', 'Thank you. Let\'s talk again.', 'Until next time, then.'],
    },
    female: {
      greeting: ['Excuse me, do you have a moment?', 'I was hoping we could talk...', 'Sorry to bother you, just a moment?'],
      hobbyPrompt: ['By the way, do you have any hobbies?', 'What do you usually do in your free time?', 'Have you been into anything lately?'],
      farewell: ['I\'m glad we could talk. Well then.', 'Thank you. Let\'s chat again.', 'Until next time, then.'],
    },
  },
  stubborn: {
    male: {
      greeting: ['...We need to talk.', '...Got a minute?', 'I want to talk.'],
      hobbyPrompt: ['...What do you do with your time?', 'Do you have any hobbies?', '...Is there anything you like?'],
      farewell: ['...Later.', 'That\'s all.', '...I\'ll be back.'],
    },
    female: {
      greeting: ['...I need to talk to you.', '...Do you mind? Just a moment.', 'I\'d like to talk.'],
      hobbyPrompt: ['...What do you do with your time?', 'Do you have any hobbies?', '...Is there anything you like?'],
      farewell: ['...Bye.', 'That\'s all for now.', '...I\'ll come again.'],
    },
  },
  flexible: {
    male: {
      greeting: ['Hey hey, got a minute?', 'Oh, wanna chat?', 'Hiii~ you free?'],
      hobbyPrompt: ['So like, you into anything lately?', 'Hey, what do you do on weekends?', 'Got any hobbies? I wanna know!'],
      farewell: ['See ya~ let\'s talk again!', 'Thanks, that was fun! Later!', 'Well, see ya~'],
    },
    female: {
      greeting: ['Hey hey, got a minute?', 'Oh, wanna chat?', 'Hiii~ you free?'],
      hobbyPrompt: ['So like, you into anything lately?', 'Hey, what do you do on weekends?', 'Got any hobbies? I wanna know!'],
      farewell: ['See ya~ let\'s talk again!', 'Thanks, that was fun! Later!', 'Well, see ya~'],
    },
  },
  cunning: {
    male: {
      greeting: ['Hey, got a moment?', 'Mind if I steal a bit of your time?', 'There\'s something I wanted to ask you.'],
      hobbyPrompt: ['So, what sort of things interest you?', 'Hey, do you have anything you\'re into?', 'Mind if I ask about your hobbies?'],
      farewell: ['Heh, see you around.', 'That was enlightening. Until next time.', 'Well then, another time.'],
    },
    female: {
      greeting: ['Hey, do you have a moment?', 'Mind if I have a bit of your time?', 'There\'s something I wanted to ask you.'],
      hobbyPrompt: ['So, what sort of things interest you?', 'Hey, do you have anything you\'re into?', 'Mind if I ask about your hobbies?'],
      farewell: ['Hehe, see you around.', 'That was lovely. Until next time.', 'Well then, another time.'],
    },
  },
};

// ============================
// Chitchat lines (NPC-initiated)
// ============================

export const EN_CHITCHAT_LINES_DATA: Record<Personality, Record<Gender, ChitchatLineSet>> = {
  passionate: {
    male: {
      opener: ['Hey, wait up!', 'Yo! Glad I ran into you!', 'Hey! You\'re free right now, right?!'],
      topic: ['We\'re totally winning the sports festival!', 'Did you see the game yesterday? What a comeback!', 'Man, isn\'t there anything fun going on lately?'],
      closer: ['Alright, later!', 'Oops, gotta run! See ya!', 'Good break! Later!'],
    },
    female: {
      opener: ['Oh, perfect timing!', 'Hey hey, listen to this!', 'Hi there! Got a minute?'],
      topic: ['Have you started prepping for the festival yet?', 'I found this amazing song recently!', 'Today\'s class was soooo boring, right?'],
      closer: ['See ya!', 'Oh, I gotta go! Bye!', 'That was fun! Let\'s chat again!'],
    },
  },
  cautious: {
    male: {
      opener: ['Oh, excuse me... do you have a moment?', 'Um... could we talk briefly?', '...What a coincidence. Just for a moment.'],
      topic: ['I heard there are new books in the library.', 'Did you check the range for tomorrow\'s quiz?', 'The hallways have been rather noisy lately...'],
      closer: ['Well, I\'ll be going then.', 'Thank you for your time.', 'Until next time...'],
    },
    female: {
      opener: ['Oh... hello. Do you have a moment?', 'Um... just for a little bit...', '...Oh, good timing.'],
      topic: ['The library after school is so peaceful...', 'I read the most wonderful book yesterday...', 'The weather has been so unpredictable lately...'],
      closer: ['Well then... bye.', 'Sorry for keeping you.', 'Thank you... see you.'],
    },
  },
  stubborn: {
    male: {
      opener: ['...Hey.', 'I need to talk.', '...Good, come with me.'],
      topic: ['Don\'t you think discipline has been slipping lately?', 'What\'s your take on the election?', '...Well, even I need a break sometimes.'],
      closer: ['...Let\'s go.', 'Enough small talk.', '...That was... acceptable.'],
    },
    female: {
      opener: ['...Hey.', 'You. A moment.', '...I need to talk.'],
      topic: ['What do you think of the class atmosphere lately?', 'The election -- what\'s your stance?', '...Talking like this once in a while isn\'t so bad.'],
      closer: ['...Bye then.', 'That\'s all I needed.', '...See you.'],
    },
  },
  flexible: {
    male: {
      opener: ['Oh, hey there~!', 'Perfect timing! Got a sec?', 'Oh, what a coincidence!'],
      topic: ['What did you have for lunch? I had curry~', 'Did you hear about the new game that came out?', 'Man, nice weather today, huh~'],
      closer: ['Well, see ya~!', 'Oh, I should get going!', 'That was a nice break~'],
    },
    female: {
      opener: ['Oh~! Fancy meeting you here!', 'Hey hey, you free right now?', 'Hiii~!'],
      topic: ['My lunch was sooo good today~', 'You been into anything fun lately?', 'Hey, did you see that poster in the hall?'],
      closer: ['Bye bye~!', 'Oh, gotta run! See ya!', 'Let\'s chat again sometime!'],
    },
  },
  cunning: {
    male: {
      opener: ['Well, fancy meeting you here.', 'Got a moment...?', 'What good timing.'],
      topic: ['I heard an interesting rumor recently...', 'The behind-the-scenes election stuff is pretty intriguing.', 'People-watching is such a fascinating hobby.'],
      closer: ['Well then, see you.', 'A productive exchange.', 'Heh... let\'s talk again.'],
    },
    female: {
      opener: ['Oh my, hello there.', 'Hey, do you have a moment?', 'Hehe, how convenient.'],
      topic: ['Something has been on my mind lately...', 'Those two have been spending a lot of time together, haven\'t they...', 'Elections are rather interesting, don\'t you think?'],
      closer: ['Bye for now.', 'Do let me know if you hear anything.', 'Hehe, that was lovely.'],
    },
  },
};

export const EN_CHITCHAT_NARRATIONS: string[] = [
  'Someone called out to you in the hallway.',
  'You were stopped by a familiar face.',
  'A passing student struck up a conversation.',
  'You bumped into someone and ended up chatting.',
];

export const EN_NARRATION_RESULTS: Record<'positive' | 'negative' | 'neutral', string[]> = {
  positive: [
    'You seem to have gotten a little closer.',
    'The distance between you feels shorter.',
    'The conversation ended on a good note.',
  ],
  negative: [
    'An awkward silence hung in the air.',
    'You don\'t seem to have left a good impression.',
    'The conversation ended on a stiff note.',
  ],
  neutral: [
    'Nothing seemed to change.',
    'The conversation ended uneventfully.',
    'It was a so-so exchange.',
  ],
};

// ============================
// Battle counter lines (personality x mood x gender)
// ============================

export const EN_COUNTER_LINES: Record<Personality, Record<MoodGroup, { male: string[]; female: string[] }>> = {
  passionate: {
    angry: {
      male: [
        'Don\'t mess with us! You think our feelings are a joke?!',
        'You think some fancy logic is gonna shut me up?!',
        '...Not yet! I\'m not beaten yet!',
        'Shut it! We\'re dead serious over here!',
      ],
      female: [
        'Don\'t you dare! Our feelings aren\'t a joke!',
        'You think that\'s gonna shut me up?!',
        '...Not yet! I haven\'t lost!',
        'Quiet! I\'m serious about this!',
      ],
    },
    normal: {
      male: [
        'Here\'s what I think -- just hear me out!',
        'But hey, what about looking at it this way?',
        'Not bad, but listen to my take too!',
        'My passion won\'t lose to yours!',
      ],
      female: [
        'Here\'s what I think -- just hear me out!',
        'But hey, what about looking at it this way?',
        'Not bad, but hear me out too!',
        'My passion won\'t back down!',
      ],
    },
    happy: {
      male: [
        'I see your point, but...',
        'Makes sense... but I still feel this way.',
        'Good argument... but there are things I can\'t budge on.',
        'Fair enough... but my conviction hasn\'t changed.',
      ],
      female: [
        'I see what you\'re saying, but...',
        'That makes sense... but I still feel this way.',
        'Good point... but there are things I can\'t give up.',
        'You\'re right, but... my heart hasn\'t changed.',
      ],
    },
  },
  cautious: {
    angry: {
      male: [
        'That data lacks sufficient evidence.',
        'We can\'t make decisions based on emotion alone...',
        '...Please try to be more rational.',
        'I don\'t believe that\'s logically sound.',
      ],
      female: [
        'That data doesn\'t have enough backing.',
        'We can\'t judge based on feelings alone...',
        '...I wish you\'d think more calmly about this.',
        'I don\'t think that\'s very logical.',
      ],
    },
    normal: {
      male: [
        'I see... however, there\'s another way to look at it.',
        'You make a point, but what do the numbers say?',
        'Could we perhaps examine this from another angle?',
        'That\'s an interesting opinion, but... I have a counterpoint.',
      ],
      female: [
        'I see... but there\'s another way to look at it.',
        'You have a point, but what about the data?',
        'Could we look at this from a different angle?',
        'That\'s interesting, but... I have a counterpoint.',
      ],
    },
    happy: {
      male: [
        'Good perspective... but this part concerns me.',
        'I understand your point... however...',
        'Excellent analysis. Though I have a small addendum...',
        'That may be a one-sided view.',
      ],
      female: [
        'Good perspective... but this part concerns me.',
        'I understand what you\'re saying... however...',
        'Excellent analysis. Though I\'d like to add something...',
        'That might be a bit one-sided.',
      ],
    },
  },
  stubborn: {
    angry: {
      male: [
        '...Not worth discussing.',
        'Nothing you say will change anything.',
        '...Be quiet.',
        'That naive thinking won\'t fly.',
      ],
      female: [
        '...This isn\'t worth discussing.',
        'Nothing you say matters.',
        '...Be quiet.',
        'That naive thinking won\'t get you anywhere.',
      ],
    },
    normal: {
      male: [
        '...That\'s wrong.',
        'My mind won\'t change.',
        'Say it as many times as you want. Same answer.',
        '...Your logic doesn\'t hold.',
      ],
      female: [
        '...That\'s wrong.',
        'My mind won\'t change.',
        'No matter how many times you say it, the answer is the same.',
        '...Your logic doesn\'t hold up.',
      ],
    },
    happy: {
      male: [
        '...Interesting point, but I won\'t agree.',
        'Not bad... but this is where I stand.',
        '...I can understand a little, but I won\'t budge.',
        'I see. But my conclusion stands.',
      ],
      female: [
        '...Interesting point, but I won\'t agree.',
        'Not bad... but this is how I see it.',
        '...I can understand somewhat, but I won\'t concede.',
        'I see. But my conclusion hasn\'t changed.',
      ],
    },
  },
  flexible: {
    angry: {
      male: [
        'Hmm, that\'s kinda...',
        'Uh, I dunno about that one...',
        'Wait wait, I think that\'s wrong!',
        'Whoa whoa, that\'s going too far...',
      ],
      female: [
        'Hmm, that\'s kinda...',
        'Uh, I dunno about that one...',
        'Hold on, I think that\'s not right!',
        'Whoa, that\'s a bit much...',
      ],
    },
    normal: {
      male: [
        'I get that~ but how about something like this?',
        'Yeah yeah! ...But this is good too, right?',
        'Ooh, interesting! So what about this then?',
        'Nice! But y\'know, there\'s also this way of thinking.',
      ],
      female: [
        'I get that~ but how about something like this?',
        'Yeah yeah! ...But this is nice too, right?',
        'Ooh, interesting! So what about this?',
        'Nice! But y\'know, there\'s also this approach~',
      ],
    },
    happy: {
      male: [
        'Yeah yeah, that\'s nice~ Oh, but...',
        'I see~! But I feel like it\'s a tiny bit different...',
        'I think so too! ...Oh, but this one thing bugs me.',
        'Right right~ Just let me say one thing though?',
      ],
      female: [
        'Yeah yeah, that\'s nice~ Oh, but...',
        'I see~! But it feels a tiny bit off...',
        'I think so too! ...Oh, but just this one thing.',
        'Right right~ Just let me say one little thing?',
      ],
    },
  },
  cunning: {
    angry: {
      male: [
        'Hm... quite confident, aren\'t we?',
        'Are you serious about that?',
        '...How naive. Think it over.',
        'Oh, that\'s one way to see it... a shallow one.',
      ],
      female: [
        'Hm... quite confident, aren\'t you?',
        'Are you serious about that?',
        '...How naive. Perhaps reconsider?',
        'Oh my, that\'s one perspective... a shallow one.',
      ],
    },
    normal: {
      male: [
        'Heh... not bad.',
        'Interesting point. But consider this angle.',
        'Heh, decent... but your follow-through is weak.',
        'That logic -- how far will it really take you?',
      ],
      female: [
        'Heh... not bad at all.',
        'Interesting point. But there\'s another angle, you know.',
        'Hehe, decent... but the follow-through is lacking.',
        'That logic -- I wonder how far it\'ll take you.',
      ],
    },
    happy: {
      male: [
        'Heh, you make a good point.',
        'Heh... I\'ll give you that. But this part is still weak.',
        'Not bad. But there\'s always another side to things.',
        'You\'re getting close... just a little more, maybe.',
      ],
      female: [
        'Oh my, quite a good point.',
        'Hehe... I\'ll give you that. But this part is still weak.',
        'Not bad. But there\'s always another side, you know.',
        'Getting close... just a bit more, perhaps.',
      ],
    },
  },
};

// ============================
// Player battle lines (attitude x topic x stance x gender)
// ============================

export const EN_PLAYER_BATTLE_LINES: Record<PlayerAttitude, Record<TopicCategory, Record<Stance, { male: string[]; female: string[] }>>> = {
  friendly: {
    faction: {
      positive: {
        male: [
          'Don\'t you think this direction could work?',
          'This approach is pretty solid, don\'t you think?',
          'Personally, I\'m a fan of this path.',
          'Something like this could be good too, right?',
        ],
        female: [
          'Don\'t you think this direction could work?',
          'Hey, isn\'t this approach kind of great?',
          'Personally, I really like this direction.',
          'Something like this could be nice too, right?',
        ],
      },
      negative: {
        male: [
          'Hmm, this part kinda bugs me a little.',
          'There\'s just one thing that doesn\'t sit right with me.',
          'Maybe reconsider that part?',
          'It\'s not bad, but... this one thing bothers me.',
        ],
        female: [
          'Hmm, this part kinda bugs me a little.',
          'There\'s just one thing that doesn\'t sit right.',
          'Maybe we should reconsider that part?',
          'It\'s not bad, but... this one thing bothers me.',
        ],
      },
    },
    hobby: {
      positive: {
        male: [
          'That\'s awesome, great topic!',
          'I get it! That\'s fun, right?',
          'Oh, I\'ve been getting into that myself!',
          'Hey, nice taste!',
        ],
        female: [
          'That\'s awesome, great topic!',
          'I totally get it! So fun, right?',
          'Oh, I\'ve been getting into that too!',
          'Hey, great taste!',
        ],
      },
      negative: {
        male: [
          'Hmm, I dunno about that one...',
          'That\'s not really my thing...',
          'I\'m not sure that clicks for me.',
          'I see... I guess we\'re a bit different there.',
        ],
        female: [
          'Hmm, I dunno about that one...',
          'That\'s not really my thing...',
          'I\'m not sure it clicks for me.',
          'I see... I guess we\'re a bit different there.',
        ],
      },
    },
  },
  normal: {
    faction: {
      positive: {
        male: [
          'I think I can get behind this policy.',
          'This is something worth supporting.',
          'I think this approach is the right call.',
          'Going this route seems like the best move.',
        ],
        female: [
          'I think I can support this policy.',
          'This is definitely worth backing.',
          'I think this approach is solid.',
          'Going this route seems like the best move.',
        ],
      },
      negative: {
        male: [
          'I have to disagree with that.',
          'I think we should reconsider this.',
          'I see some problems with that idea.',
          'I can\'t really get on board with that one.',
        ],
        female: [
          'I have to disagree with that.',
          'I think we should reconsider this.',
          'I see some problems with that idea.',
          'I can\'t really get on board with that.',
        ],
      },
    },
    hobby: {
      positive: {
        male: [
          'That\'s pretty cool.',
          'Yeah, I kinda like that.',
          'I get it, that\'s fun.',
          'I\'m interested in that too, actually.',
        ],
        female: [
          'That\'s pretty cool.',
          'Yeah, I kinda like that.',
          'I get it, that\'s fun.',
          'I\'m actually interested in that too.',
        ],
      },
      negative: {
        male: [
          'That\'s not really for me.',
          'Honestly, not that interested.',
          'I don\'t think that suits me.',
          'Hmm, it doesn\'t really click.',
        ],
        female: [
          'That\'s not really for me.',
          'Honestly, not that interested.',
          'I don\'t think that\'s for me.',
          'Hmm, it doesn\'t really click.',
        ],
      },
    },
  },
  strong: {
    faction: {
      positive: {
        male: [
          'This is it! This is the only way!',
          'I\'m telling you, this policy is the best!',
          'I won\'t back down on this! This is the right path!',
          'I mean it -- this is the way forward!',
        ],
        female: [
          'This is it! This is absolutely the way!',
          'Trust me, this policy is the best!',
          'I won\'t back down! This is how it should be!',
          'I\'m serious -- this is the right path!',
        ],
      },
      negative: {
        male: [
          'That\'s absolutely wrong!',
          'I\'ll say it straight -- that approach won\'t work!',
          'There\'s no way that\'ll succeed!',
          'Wake up! That\'s a recipe for disaster!',
        ],
        female: [
          'That\'s absolutely wrong!',
          'I\'ll say it straight -- that approach won\'t work!',
          'There\'s no way that\'ll succeed!',
          'Open your eyes! That\'ll only lead to failure!',
        ],
      },
    },
    hobby: {
      positive: {
        male: [
          'That\'s incredible! The best!',
          'I love that! Let me tell you all about it!',
          'See, that\'s what I\'m talking about! You get it!',
          'Yes! I\'m a huge fan of that too!',
        ],
        female: [
          'That\'s incredible! The absolute best!',
          'I love that so much! Let me gush about it!',
          'See?! That\'s what I\'m talking about!',
          'Yes! I absolutely love that!',
        ],
      },
      negative: {
        male: [
          'Nah, absolutely not!',
          'I\'ll be honest -- that\'s no good at all!',
          'What\'s even good about that? I don\'t get it!',
          'I\'ll say it plain -- that\'s just not fun!',
        ],
        female: [
          'No way, not that!',
          'I\'ll be honest -- that\'s no good at all!',
          'What\'s even good about that? I don\'t get it!',
          'I\'ll say it straight -- that\'s just not fun!',
        ],
      },
    },
  },
};
