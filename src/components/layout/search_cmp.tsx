export default function SearchInput() {
    return (
        <div style={{ display: 'flex', padding: '8px', width: '100%', gap: '16px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '16px', background: '#fff', padding: '8px', borderRadius: '64px', flex: 1 }}>
                <img src="https://img.icons8.com/?size=100&id=7695&format=png&color=7a7a7a" style={{ width: '30px', height: '30px' }} />
                <input placeholder="search..." style={{ flex: 1, background: 'none', color: '#000', fontSize: '16px', outline: 'none', border: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '64px', padding: '4px' }}>
                <img src="https://img.icons8.com/?size=100&id=18636&format=png&color=000000" style={{ width: '30px', height: '30px' }} />
            </div>
        </div>
    )
}
