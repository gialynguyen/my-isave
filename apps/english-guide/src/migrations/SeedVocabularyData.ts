import { Migration } from '@mikro-orm/migrations';

export class SeedVocabularyData extends Migration {

  async up(): Promise<void> {
    // Insert sample vocabulary data for different difficulty levels
    
    // Beginner level vocabulary
    this.addSql(`
      INSERT INTO "vocabulary" ("word", "definition", "pronunciation", "examples", "difficulty", "tags") VALUES
      ('hello', 'A greeting used when meeting someone', '/həˈloʊ/', '["Hello, how are you?", "She said hello to her neighbor"]', 'beginner', '["greeting", "basic"]'),
      ('cat', 'A small domesticated carnivorous mammal', '/kæt/', '["The cat is sleeping on the sofa", "I have a black cat"]', 'beginner', '["animal", "pet"]'),
      ('book', 'A written or printed work consisting of pages', '/bʊk/', '["I am reading a good book", "She bought a new book"]', 'beginner', '["object", "education"]'),
      ('water', 'A transparent liquid that forms the seas, lakes, rivers, and rain', '/ˈwɔːtər/', '["I drink water every day", "The water is very cold"]', 'beginner', '["liquid", "basic"]'),
      ('house', 'A building for human habitation', '/haʊs/', '["They live in a big house", "The house has a red door"]', 'beginner', '["building", "home"]'),
      ('happy', 'Feeling or showing pleasure or contentment', '/ˈhæpi/', '["She looks very happy today", "The children are happy"]', 'beginner', '["emotion", "adjective"]'),
      ('eat', 'To put food into the mouth and chew and swallow it', '/iːt/', '["I eat breakfast every morning", "They eat dinner together"]', 'beginner', '["action", "food"]'),
      ('run', 'To move at a speed faster than a walk', '/rʌn/', '["I run in the park every day", "The dog can run very fast"]', 'beginner', '["action", "exercise"]'),
      ('blue', 'Of a color intermediate between green and violet', '/bluː/', '["The sky is blue today", "She has blue eyes"]', 'beginner', '["color", "adjective"]'),
      ('friend', 'A person whom one knows and with whom one has a bond of mutual affection', '/frend/', '["She is my best friend", "I met my friend at school"]', 'beginner', '["relationship", "person"]);
    `);

    // Intermediate level vocabulary
    this.addSql(`
      INSERT INTO "vocabulary" ("word", "definition", "pronunciation", "examples", "difficulty", "tags") VALUES
      ('accomplish', 'To achieve or complete successfully', '/əˈkʌmplɪʃ/', '["She accomplished her goals this year", "We need to accomplish this task by Friday"]', 'intermediate', '["achievement", "success"]'),
      ('analyze', 'To examine methodically and in detail', '/ˈænəlaɪz/', '["Scientists analyze the data carefully", "Let me analyze this problem"]', 'intermediate', '["thinking", "examination"]'),
      ('consequence', 'A result or effect of an action or condition', '/ˈkɑːnsəkwəns/', '["Every action has a consequence", "The consequence of his decision was positive"]', 'intermediate', '["result", "effect"]'),
      ('demonstrate', 'To clearly show the existence or truth of something', '/ˈdemənstreɪt/', '["The teacher will demonstrate the experiment", "This example demonstrates the concept well"]', 'intermediate', '["show", "prove"]'),
      ('environment', 'The surroundings or conditions in which a person, animal, or plant lives', '/ɪnˈvaɪrənmənt/', '["We must protect our environment", "The work environment is very friendly"]', 'intermediate', '["nature", "surroundings"]'),
      ('fundamental', 'Forming a necessary base or core; of central importance', '/ˌfʌndəˈmentl/', '["Reading is a fundamental skill", "These are fundamental principles"]', 'intermediate', '["basic", "essential"]'),
      ('generate', 'To cause something to arise or come about', '/ˈdʒenəreɪt/', '["Solar panels generate electricity", "This discussion will generate new ideas"]', 'intermediate', '["create", "produce"]'),
      ('hypothesis', 'A supposition or proposed explanation made on the basis of limited evidence', '/haɪˈpɑːθəsɪs/', '["The scientist tested her hypothesis", "We need to form a hypothesis first"]', 'intermediate', '["theory", "science"]'),
      ('implement', 'To put a decision or plan into effect', '/ˈɪmpləment/', '["We will implement the new policy next month", "It is time to implement our strategy"]', 'intermediate', '["execute", "apply"]'),
      ('justify', 'To show or prove to be right or reasonable', '/ˈdʒʌstɪfaɪ/', '["Can you justify your decision?", "The results justify our approach"]', 'intermediate', '["explain", "defend"]);
    `);

    // Advanced level vocabulary
    this.addSql(`
      INSERT INTO "vocabulary" ("word", "definition", "pronunciation", "examples", "difficulty", "tags") VALUES
      ('ambiguous', 'Open to more than one interpretation; having a double meaning', '/æmˈbɪɡjuəs/', '["The contract language was ambiguous", "Her response was deliberately ambiguous"]', 'advanced', '["unclear", "complex"]'),
      ('bureaucracy', 'A system of government in which most decisions are made by state officials', '/bjʊˈrɑːkrəsi/', '["The bureaucracy slowed down the process", "Government bureaucracy can be frustrating"]', 'advanced', '["government", "system"]'),
      ('contemplate', 'To think about something deeply and thoroughly', '/ˈkɑːntəmpleɪt/', '["She contemplated her future career", "I need time to contemplate this decision"]', 'advanced', '["think", "consider"]'),
      ('deteriorate', 'To become progressively worse', '/dɪˈtɪriəreɪt/', '["His health began to deteriorate", "The situation continued to deteriorate"]', 'advanced', '["worsen", "decline"]'),
      ('eloquent', 'Fluent or persuasive in speaking or writing', '/ˈeləkwənt/', '["She gave an eloquent speech", "His eloquent words moved the audience"]', 'advanced', '["articulate", "persuasive"]'),
      ('facilitate', 'To make an action or process easier or help bring about', '/fəˈsɪlɪteɪt/', '["Technology can facilitate learning", "The mediator will facilitate the discussion"]', 'advanced', '["help", "enable"]'),
      ('gregarious', 'Fond of the company of others; sociable', '/ɡrɪˈɡeriəs/', '["He has a gregarious personality", "Gregarious people enjoy social gatherings"]', 'advanced', '["social", "outgoing"]'),
      ('hierarchy', 'A system in which members are ranked according to relative status or authority', '/ˈhaɪərɑːrki/', '["The company has a strict hierarchy", "Social hierarchy affects behavior"]', 'advanced', '["structure", "ranking"]'),
      ('inevitable', 'Certain to happen; unavoidable', '/ɪnˈevɪtəbl/', '["Change is inevitable in life", "The outcome was inevitable"]', 'advanced', '["unavoidable", "certain"]'),
      ('juxtapose', 'To place or deal with close together for contrasting effect', '/ˈdʒʌkstəpoʊz/', '["The artist juxtaposed light and dark colors", "The essay juxtaposes two different viewpoints"]', 'advanced', '["contrast", "compare"]);
    `);
  }

  async down(): Promise<void> {
    // Remove all seeded vocabulary data
    this.addSql(`DELETE FROM "vocabulary" WHERE "word" IN (
      'hello', 'cat', 'book', 'water', 'house', 'happy', 'eat', 'run', 'blue', 'friend',
      'accomplish', 'analyze', 'consequence', 'demonstrate', 'environment', 'fundamental', 'generate', 'hypothesis', 'implement', 'justify',
      'ambiguous', 'bureaucracy', 'contemplate', 'deteriorate', 'eloquent', 'facilitate', 'gregarious', 'hierarchy', 'inevitable', 'juxtapose'
    );`);
  }
}