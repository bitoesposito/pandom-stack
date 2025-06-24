import * as bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'Password1!'; // la password che vuoi hashare
    const saltRounds = 12; // lo stesso salt rounds usato nel progetto

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash:', hash);
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generateHash(); 